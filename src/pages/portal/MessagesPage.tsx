import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2, MessageSquare, ArrowLeft, Check, CheckCheck, Search, Plus, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  delivered: boolean;
  created_at: string;
}

interface Contact {
  user_id: string;
  name: string;
  role: string;
  unread: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface ProfileDisplay {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
}

// Triple-check icon for "read"
const TripleCheck = ({ className }: { className?: string }) => (
  <span className={cn("inline-flex items-center -space-x-1.5", className)}>
    <Check className="w-3 h-3" />
    <Check className="w-3 h-3" />
    <Check className="w-3 h-3" />
  </span>
);

// Online indicator dot with pulse animation
const OnlineDot = ({ online, size = "sm" }: { online: boolean; size?: "sm" | "md" }) => (
  <span
    className={cn(
      "rounded-full shrink-0 border-2 border-card relative",
      online ? "bg-success" : "bg-destructive",
      size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"
    )}
  >
    {online && (
      <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
    )}
  </span>
);

const MessagesPage = () => {
  const { user, userRole, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Presence tracking
  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const ids = new Set<string>(Object.keys(state));
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // Mark messages as delivered when recipient comes online
  useEffect(() => {
    if (!user || !selectedContact) return;
    const undelivered = messages.filter(
      (m) => m.sender_id === selectedContact.user_id && m.recipient_id === user.id && !m.delivered
    );
    if (undelivered.length > 0) {
      const ids = undelivered.map((m) => m.id);
      supabase
        .from("messages")
        .update({ delivered: true })
        .in("id", ids)
        .then(() => {});
    }
  }, [messages, selectedContact, user]);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Use security definer function so all authenticated users can see names for messaging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allProfiles } = await (supabase as any).rpc("get_profiles_display");

    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const msgs = (allMessages ?? []) as Message[];
    const profiles = (allProfiles ?? []) as ProfileDisplay[];

    const contactUserIds = new Set<string>();
    // Admins are always visible as contacts
    profiles.filter((p) => p.role === "admin" && p.user_id !== user.id).forEach((p) => contactUserIds.add(p.user_id));
    // Add users from message history
    msgs.forEach((m) => {
      if (m.sender_id !== user.id) contactUserIds.add(m.sender_id);
      if (m.recipient_id !== user.id) contactUserIds.add(m.recipient_id);
    });

    const contactList: Contact[] = [];
    contactUserIds.forEach((uid) => {
      const profile = profiles.find((p) => p.user_id === uid);
      const userMsgs = msgs.filter(
        (m) => (m.sender_id === uid && m.recipient_id === user.id) || (m.sender_id === user.id && m.recipient_id === uid)
      );
      const unread = msgs.filter((m) => m.sender_id === uid && m.recipient_id === user.id && !m.read).length;
      const last = userMsgs[0];

      contactList.push({
        user_id: uid,
        name: profile ? `${profile.first_name} ${profile.last_name}`.trim() || `User ${uid.slice(0, 6)}` : `User ${uid.slice(0, 6)}`,
        role: profile?.role || "user",
        unread,
        lastMessage: last?.content,
        lastMessageAt: last?.created_at,
      });
    });

    contactList.sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      return (b.lastMessageAt || "").localeCompare(a.lastMessageAt || "");
    });

    setContacts(contactList);

    const availableUsers = profiles
      .filter((p) => p.user_id !== user.id)
      .filter((p) => {
        if (isAdmin) return true;
        if (userRole === "parent") return p.role === "childminder" || p.role === "admin";
        if (userRole === "childminder") return p.role === "parent" || p.role === "admin";
        return p.role === "admin";
      })
      .map((p) => ({
        user_id: p.user_id,
        name: `${p.first_name} ${p.last_name}`.trim() || `User ${p.user_id.slice(0, 6)}`,
        role: p.role,
        unread: 0,
      }));
    setAllUsers(availableUsers);
    setLoading(false);
  }, [user, userRole, isAdmin]);

  const loadMessages = useCallback(async () => {
    if (!user || !selectedContact) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${selectedContact.user_id}),and(sender_id.eq.${selectedContact.user_id},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);

    await supabase
      .from("messages")
      .update({ read: true, delivered: true })
      .eq("sender_id", selectedContact.user_id)
      .eq("recipient_id", user.id)
      .eq("read", false);
  }, [user, selectedContact]);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { if (selectedContact) { loadMessages(); setShowNewChat(false); } }, [selectedContact, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user.id || msg.recipient_id === user.id) {
            if (
              selectedContact &&
              ((msg.sender_id === selectedContact.user_id && msg.recipient_id === user.id) ||
                (msg.sender_id === user.id && msg.recipient_id === selectedContact.user_id))
            ) {
              setMessages((prev) => [...prev, msg]);
              if (msg.sender_id !== user.id) {
                supabase.from("messages").update({ read: true, delivered: true }).eq("id", msg.id).then(() => {});
              }
            }
            loadContacts();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => m.id === updated.id ? { ...m, read: updated.read, delivered: updated.delivered } : m)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedContact, loadContacts]);

  const sendMessage = async () => {
    if (!user || !selectedContact || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: selectedContact.user_id,
      content: newMessage.trim(),
    });
    setSending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewChat = (contact: Contact) => {
    setSelectedContact(contact);
    setShowNewChat(false);
    setSearchQuery("");
  };

  const filteredNewUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const inContacts = contacts.some((c) => c.user_id === u.user_id);
    return (!q || u.name.toLowerCase().includes(q)) && !inContacts;
  });

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-destructive/10 text-destructive",
      owner: "bg-destructive/10 text-destructive",
      childminder: "bg-secondary/10 text-secondary",
      parent: "bg-primary/15 text-foreground",
    };
    return <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold capitalize ${colors[role] || "bg-muted text-muted-foreground"}`}>{role}</span>;
  };

  // Render tick status for sent messages
  const renderTicks = (msg: Message) => {
    if (msg.read) {
      // 3 ticks — read (blue)
      return <TripleCheck className="text-primary" />;
    }
    if (msg.delivered) {
      // 2 ticks — delivered (grey)
      return <CheckCheck className="w-3.5 h-3.5" />;
    }
    // 1 tick — sent
    return <Check className="w-3 h-3" />;
  };

  if (loading) return <div className="text-muted-foreground">Nachrichten werden geladen…</div>;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nachrichten</h1>
        <p className="text-muted-foreground text-sm mb-4">Chatten Sie mit Eltern, Betreuungspersonen und dem KinderStars-Team.</p>
      </div>

      <div className="flex-1 flex border border-border rounded-xl overflow-hidden bg-card min-h-0">
        {/* Contact list */}
        <div className={`w-full sm:w-[280px] border-r border-border flex flex-col shrink-0 ${selectedContact && !showNewChat ? "hidden sm:flex" : "flex"}`}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unterhaltungen</p>
            <button onClick={() => { setShowNewChat(!showNewChat); setSelectedContact(null); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNewChat ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-xs bg-background"
                    placeholder="Personen suchen…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                </div>
              </div>
              {filteredNewUsers.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs p-4">{t("portal.common.noResults")}</p>
              ) : filteredNewUsers.map((u) => (
                <button key={u.user_id} onClick={() => startNewChat(u)}
                  className="w-full text-left p-3 border-b border-border transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <OnlineDot online={onlineUsers.has(u.user_id)} />
                    <span className="font-medium text-sm truncate flex-1">{u.name}</span>
                    {roleBadge(u.role)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 ml-4">
                    {onlineUsers.has(u.user_id) ? (
                      <><Wifi className="w-3 h-3 text-success" /> {t("portal.common.online")}</>
                    ) : (
                      <><WifiOff className="w-3 h-3 text-destructive" /> {t("portal.common.offline")}</>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t("portal.messages.noConversations")}
                  <Button variant="warm" size="sm" className="mt-3 gap-1" onClick={() => setShowNewChat(true)}>
                    <Plus className="w-3.5 h-3.5" /> {t("portal.messages.newMessage")}
                  </Button>
                </div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.user_id}
                    onClick={() => setSelectedContact(c)}
                    className={`w-full text-left p-3 border-b border-border transition-colors hover:bg-muted/50 ${
                      selectedContact?.user_id === c.user_id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <OnlineDot online={onlineUsers.has(c.user_id)} />
                        <span className="font-medium text-sm truncate">{c.name}</span>
                        {roleBadge(c.role)}
                      </div>
                      {c.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-muted-foreground truncate max-w-[160px] ml-4">{c.lastMessage || "Keine Nachrichten"}</span>
                      {c.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {format(new Date(c.lastMessageAt), "dd/MM HH:mm")}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedContact ? "hidden sm:flex" : "flex"}`}>
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-border flex items-center gap-2">
                <button className="sm:hidden text-muted-foreground" onClick={() => setSelectedContact(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <OnlineDot online={onlineUsers.has(selectedContact.user_id)} size="md" />
                    <p className="font-bold text-sm">{selectedContact.name}</p>
                    {roleBadge(selectedContact.role)}
                  </div>
                  <p className="text-[11px] text-muted-foreground ml-5 flex items-center gap-1">
                    {onlineUsers.has(selectedContact.user_id) ? (
                      <><Wifi className="w-3 h-3 text-success" /> {t("portal.common.online")} — {t("portal.common.activeNow")}</>
                    ) : (
                      <><WifiOff className="w-3 h-3 text-muted-foreground" /> {t("portal.common.offline")}</>
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-xs mt-8">{t("portal.messages.noMessages")}</p>
                )}
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === user?.id;
                  const prevMsg = messages[idx - 1];
                  const showDate = !prevMsg || format(new Date(msg.created_at), "yyyy-MM-dd") !== format(new Date(prevMsg.created_at), "yyyy-MM-dd");

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-3">
                          <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                            {format(new Date(msg.created_at), "dd MMM yyyy")}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                            isMine
                              ? "bg-secondary text-secondary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMine ? "text-secondary-foreground/50" : "text-muted-foreground"}`}>
                            <span className="text-[10px]">{format(new Date(msg.created_at), "HH:mm")}</span>
                            {isMine && renderTicks(msg)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("portal.messages.typeMessage")}
                  className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-secondary/20 bg-background"
                  maxLength={2000}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="px-3"
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{t("portal.messages.selectConversation")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
