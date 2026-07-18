import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { escapeHtml } from "@/lib/html-utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import {
  Plus, FileText, Loader2, Trash2, Send, Check, X, Download, Printer, Upload, Mail
} from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  amount: number;
  tax: number | null;
  total: number;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  line_items: LineItem[];
  from_user_id: string | null;
  to_user_id: string | null;
  created_at: string;
}

const BILLING_TARGETS = [
  { value: "parent", label: "Parent" },
  { value: "council", label: "Local Authority / Council" },
  { value: "sfe", label: "Student Finance England (SFE)" },
  { value: "employer", label: "Employer" },
  { value: "other", label: "Other" },
];

// ── Helpers ──────────────────────────────────────────
const generateInvoiceNumber = () => {
  const d = new Date();
  return `KS-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;
};

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/15 text-primary",
  paid: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
};

const exportCSV = (invoices: Invoice[]) => {
  const header = "Invoice Number,Status,Date,Due Date,Subtotal,Tax,Total,Notes\n";
  const rows = invoices.map((inv) =>
    [
      inv.invoice_number,
      inv.status,
      new Date(inv.created_at).toLocaleDateString("en-GB"),
      inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-GB") : "",
      Number(inv.amount).toFixed(2),
      inv.tax ? Number(inv.tax).toFixed(2) : "0.00",
      Number(inv.total).toFixed(2),
      `"${(inv.notes || "").replace(/"/g, '""')}"`,
    ].join(",")
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `KinderStars-Invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Sub-components ──────────────────────────────────

function InvoiceForm({ user, onCreated, onCancel }: { user: any; onCreated: () => void; onCancel: () => void }) {
  const [billingTarget, setBillingTarget] = useState("parent");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, rate: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);
  const tax = Math.round(subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const addLineItem = () => setLineItems([...lineItems, { description: "", quantity: 1, rate: 0 }]);
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    (updated[i] as any)[field] = value;
    setLineItems(updated);
  };

  const handleCreate = async () => {
    if (lineItems.some((li) => !li.description)) {
      toast({ title: "Please fill in all line item descriptions", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("invoices").insert({
      from_user_id: user.id,
      invoice_number: generateInvoiceNumber(),
      amount: subtotal, tax, total,
      due_date: dueDate || null,
      notes: `[${billingTarget}] ${notes}`.trim(),
      line_items: lineItems as any,
      status: "draft",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invoice created" });
      onCreated();
    }
  };

  return (
    <div className="ks-card p-5 space-y-4">
      <h2 className="font-bold">Create Invoice</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="ks-field">
          <label>Bill To</label>
          <select value={billingTarget} onChange={(e) => setBillingTarget(e.target.value)}>
            {BILLING_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="ks-field">
          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted-foreground mb-2">Line Items</label>
        {lineItems.map((li, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 mb-2 items-end">
            <div className="ks-field">
              {i === 0 && <label>Description</label>}
              <input value={li.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder="Childcare session" />
            </div>
            <div className="ks-field">
              {i === 0 && <label>Qty</label>}
              <input type="number" min={1} value={li.quantity} onChange={(e) => updateLineItem(i, "quantity", Number(e.target.value))} />
            </div>
            <div className="ks-field">
              {i === 0 && <label>Rate (£)</label>}
              <input type="number" min={0} step={0.01} value={li.rate} onChange={(e) => updateLineItem(i, "rate", Number(e.target.value))} />
            </div>
            <button onClick={() => removeLineItem(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg" disabled={lineItems.length <= 1}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLineItem} className="gap-1.5 mt-1">
          <Plus className="w-3.5 h-3.5" /> Add Line
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="ks-field">
          <label>Tax Rate (%)</label>
          <input type="number" min={0} max={100} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
        </div>
        <div className="ks-field">
          <label>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>
      </div>

      <div className="bg-muted rounded-xl p-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
        {tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>£{tax.toFixed(2)}</span></div>}
        <div className="flex justify-between font-bold text-base border-t border-border pt-1 mt-1"><span>Total</span><span>£{total.toFixed(2)}</span></div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="hero" onClick={handleCreate} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Create Invoice
        </Button>
      </div>
    </div>
  );
}

function InvoicePrintView({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePNG = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `${invoice.invoice_number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const [emailing, setEmailing] = useState(false);

  const handleEmail = async () => {
    const recipientEmail = prompt("Enter recipient email address:");
    if (!recipientEmail) return;
    setEmailing(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          subject: `Invoice ${invoice.invoice_number} from KinderStars`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: hsl(222, 95%, 13%);">KINDERSTARS LTD</h1>
              <p>Please find attached invoice <strong>${invoice.invoice_number}</strong></p>
              <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                <tr style="border-bottom:1px solid #ddd;">
                  <th style="text-align:left; padding:8px;">Description</th>
                  <th style="text-align:center; padding:8px;">Qty</th>
                  <th style="text-align:right; padding:8px;">Rate</th>
                  <th style="text-align:right; padding:8px;">Amount</th>
                </tr>
                ${invoice.line_items.map(li => `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:8px;">${escapeHtml(String(li.description))}</td>
                    <td style="text-align:center; padding:8px;">${escapeHtml(String(li.quantity))}</td>
                    <td style="text-align:right; padding:8px;">£${Number(li.rate).toFixed(2)}</td>
                    <td style="text-align:right; padding:8px;">£${(li.quantity * li.rate).toFixed(2)}</td>
                  </tr>
                `).join("")}
              </table>
              <p style="text-align:right; font-size:18px; font-weight:bold;">Total: £${Number(invoice.total).toFixed(2)}</p>
              ${invoice.due_date ? `<p>Due: ${new Date(invoice.due_date).toLocaleDateString("en-GB")}</p>` : ""}
              <hr/>
              <p style="font-size:12px; color:#999;">KinderStars Ltd • Victory House, Luton LU1 3BS • hello@kinderstars.co.uk</p>
            </div>
          `,
        },
      });
      if (error) throw error;
      toast({ title: data?.simulated ? "Email simulated (logged)" : "Invoice emailed successfully" });
    } catch (err: any) {
      toast({ title: "Email error", description: err.message, variant: "destructive" });
    }
    setEmailing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button variant="hero" size="sm" onClick={handlePNG} className="gap-1.5"><Download className="w-4 h-4" /> PNG</Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5"><Printer className="w-4 h-4" /> Print/PDF</Button>
        <Button variant="outline" size="sm" onClick={handleEmail} disabled={emailing} className="gap-1.5">
          {emailing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Email
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>Back</Button>
      </div>
      <div ref={ref} className="bg-white text-black p-8 rounded-xl border max-w-[700px] mx-auto print:border-none" style={{ fontFamily: "Georgia, serif" }}>
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "hsl(222, 95%, 13%)" }}>KINDERSTARS LTD</h1>
            <p className="text-xs text-gray-500">Victory House, Luton LU1 3BS</p>
            <p className="text-xs text-gray-500">hello@kinderstars.co.uk • 07585 803505</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: "hsl(44, 93%, 40%)" }}>INVOICE</p>
            <p className="text-sm font-mono">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-500 mt-1">Date: {new Date(invoice.created_at).toLocaleDateString("en-GB")}</p>
            {invoice.due_date && <p className="text-xs text-gray-500">Due: {new Date(invoice.due_date).toLocaleDateString("en-GB")}</p>}
            <p className={`text-xs font-bold uppercase mt-1 ${invoice.status === "paid" ? "text-green-600" : invoice.status === "overdue" ? "text-red-600" : "text-gray-600"}`}>{invoice.status}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 font-semibold">Description</th>
              <th className="text-center py-2 font-semibold w-16">Qty</th>
              <th className="text-right py-2 font-semibold w-20">Rate</th>
              <th className="text-right py-2 font-semibold w-20">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((li, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{li.description}</td>
                <td className="py-2 text-center">{li.quantity}</td>
                <td className="py-2 text-right">£{Number(li.rate).toFixed(2)}</td>
                <td className="py-2 text-right">£{(li.quantity * li.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-48 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>£{Number(invoice.amount).toFixed(2)}</span></div>
            {invoice.tax ? <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>£{Number(invoice.tax).toFixed(2)}</span></div> : null}
            <div className="flex justify-between font-bold text-base border-t border-black pt-1"><span>Total</span><span>£{Number(invoice.total).toFixed(2)}</span></div>
          </div>
        </div>

        {invoice.notes && <p className="text-xs text-gray-500 mt-6">Notes: {invoice.notes}</p>}
        <p className="text-[10px] text-gray-400 text-center mt-8 border-t pt-3">
          KinderStars Ltd • Registered in England & Wales • All payments to KinderStars Ltd
        </p>
      </div>
    </div>
  );
}

function CSVImport({ userId, onImported }: { userId: string; onImported: () => void }) {
  const [importing, setImporting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split("\n").slice(1).filter((l) => l.trim());
    let imported = 0;
    for (const line of lines) {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 7) continue;
      const [, , , , subtotalStr, taxStr, totalStr, notes] = cols;
      await supabase.from("invoices").insert({
        from_user_id: userId,
        invoice_number: generateInvoiceNumber(),
        amount: parseFloat(subtotalStr) || 0,
        tax: parseFloat(taxStr) || 0,
        total: parseFloat(totalStr) || 0,
        notes: notes || null,
        line_items: [] as any,
        status: "draft",
      });
      imported++;
    }
    setImporting(false);
    toast({ title: `Imported ${imported} invoice(s)` });
    onImported();
    e.target.value = "";
  };

  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs border border-input rounded-xl px-3 py-2 hover:bg-muted transition-colors">
      {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      Import CSV
      <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
    </label>
  );
}

// ── Main component ──────────────────────────────────

const InvoicesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (user) loadInvoices();
  }, [user]);

  const loadInvoices = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setInvoices((data || []).map((d) => ({ ...d, line_items: (d.line_items as unknown as LineItem[]) || [] })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("invoices").update({
      status,
      ...(status === "paid" ? { paid_date: new Date().toISOString().slice(0, 10) } : {}),
    }).eq("id", id);
    loadInvoices();
    toast({ title: `Invoice ${status}` });
  };

  if (loading) return <div className="text-muted-foreground p-4">Loading…</div>;

  if (printInvoice) return <InvoicePrintView invoice={printInvoice} onClose={() => setPrintInvoice(null)} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {invoices.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportCSV(invoices)} className="gap-1.5">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )}
          {user && <CSVImport userId={user.id} onImported={loadInvoices} />}
          {!creating && (
            <Button variant="hero" size="sm" onClick={() => setCreating(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> New Invoice
            </Button>
          )}
        </div>
      </div>

      {creating && user && (
        <InvoiceForm user={user} onCreated={() => { setCreating(false); loadInvoices(); }} onCancel={() => setCreating(false)} />
      )}

      {invoices.length === 0 && !creating ? (
        <div className="ks-card p-8 text-center text-muted-foreground text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No invoices yet. Create your first invoice.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="ks-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-sm">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString("en-GB")}
                    {inv.due_date && ` • Due ${new Date(inv.due_date).toLocaleDateString("en-GB")}`}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusColor[inv.status] || statusColor.draft}`}>
                  {inv.status}
                </span>
              </div>

              {inv.line_items.length > 0 && (
                <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
                  {inv.line_items.slice(0, 3).map((li, i) => (
                    <p key={i}>{li.description} × {li.quantity} @ £{Number(li.rate).toFixed(2)}</p>
                  ))}
                  {inv.line_items.length > 3 && <p>+{inv.line_items.length - 3} more items</p>}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="font-bold">£{Number(inv.total).toFixed(2)}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => setPrintInvoice(inv)} className="gap-1 text-xs">
                    <Printer className="w-3.5 h-3.5" /> View
                  </Button>
                  {inv.status === "draft" && inv.from_user_id === user?.id && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(inv.id, "sent")} className="gap-1 text-xs">
                      <Send className="w-3.5 h-3.5" /> Send
                    </Button>
                  )}
                  {inv.status === "sent" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(inv.id, "paid")} className="gap-1 text-xs text-success">
                        <Check className="w-3.5 h-3.5" /> Paid
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(inv.id, "overdue")} className="gap-1 text-xs text-destructive">
                        <X className="w-3.5 h-3.5" /> Overdue
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
