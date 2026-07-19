import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deutsche Städte mit realistischen PLZ-Präfixen (erste 3 Stellen)
const UK_LOCATIONS = [
  { town: "Berlin", districts: ["101","104","109","121","122","123"] },
  { town: "Hamburg", districts: ["201","202","203","221","224"] },
  { town: "München", districts: ["803","804","805","806","807","808"] },
  { town: "Köln", districts: ["506","507","509","510","511"] },
  { town: "Frankfurt am Main", districts: ["603","604","605","606"] },
  { town: "Stuttgart", districts: ["701","702","703","704"] },
  { town: "Düsseldorf", districts: ["402","403","404","405"] },
  { town: "Leipzig", districts: ["041","041","043","044"] },
  { town: "Dortmund", districts: ["441","442","443","444"] },
  { town: "Essen", districts: ["451","452","453","454"] },
  { town: "Bremen", districts: ["281","282","283"] },
  { town: "Dresden", districts: ["011","012","013"] },
  { town: "Hannover", districts: ["301","302","303"] },
  { town: "Nürnberg", districts: ["904","905","906"] },
  { town: "Duisburg", districts: ["470","471","472"] },
  { town: "Bochum", districts: ["447","448"] },
  { town: "Wuppertal", districts: ["421","422","423"] },
  { town: "Bielefeld", districts: ["336","337","338"] },
  { town: "Bonn", districts: ["531","532","533"] },
  { town: "Münster", districts: ["481","482","483"] },
  { town: "Karlsruhe", districts: ["761","762","763"] },
  { town: "Mannheim", districts: ["681","682","683"] },
  { town: "Augsburg", districts: ["861","862"] },
  { town: "Wiesbaden", districts: ["651","652","653"] },
  { town: "Mönchengladbach", districts: ["410","411","412"] },
  { town: "Gelsenkirchen", districts: ["458","459"] },
  { town: "Braunschweig", districts: ["381","382"] },
  { town: "Kiel", districts: ["241","242"] },
  { town: "Aachen", districts: ["520","521"] },
  { town: "Chemnitz", districts: ["091","092"] },
  { town: "Halle (Saale)", districts: ["061","062"] },
  { town: "Magdeburg", districts: ["391","392"] },
  { town: "Freiburg", districts: ["791","790"] },
  { town: "Krefeld", districts: ["474","475"] },
  { town: "Mainz", districts: ["550","551"] },
  { town: "Lübeck", districts: ["235","236"] },
  { town: "Erfurt", districts: ["990","991"] },
  { town: "Rostock", districts: ["180","181"] },
  { town: "Kassel", districts: ["341","342"] },
  { town: "Potsdam", districts: ["144","145"] },
];

const FIRST_NAMES_F = ["Emma","Mia","Hannah","Emilia","Sofia","Lina","Marie","Anna","Lea","Leonie","Klara","Laura","Julia","Sarah","Nele","Amelie","Charlotte","Johanna","Ella","Frieda","Ida","Lena","Luisa","Melina","Nora","Paula","Pia","Ronja","Selina","Theresa","Aylin","Ayşe","Elif","Zeynep","Fatma","Hafsa","Amira","Yasmin","Aisha","Maryam","Nadiya","Kateryna","Olena","Anastasiia","Iryna","Daria","Sofiya","Anastasia","Polina","Katya"];
const FIRST_NAMES_M = ["Ben","Paul","Jonas","Leon","Elias","Finn","Noah","Luis","Lukas","Felix","Maximilian","Henry","Julian","David","Jakob","Anton","Emil","Oskar","Theo","Karl","Mats","Moritz","Nils","Tim","Tom","Yusuf","Mehmet","Ahmet","Emir","Ali","Omar","Ibrahim","Amir","Hassan","Karim","Danylo","Andriy","Oleh","Mykhailo","Ivan","Nikita","Aleksandr","Maksim","Artem","Yaroslav"];
const LAST_INITIALS = "ABCDEFGHJKLMNOPRSTUVWZ";
const LANGUAGES = ["Deutsch","Englisch","Türkisch","Arabisch","Russisch","Ukrainisch","Urdu","Polnisch","Französisch","Spanisch","Italienisch","Kurdisch","Farsi","Rumänisch","Vietnamesisch"];
const AGE_GROUPS = ["0-1","2-4","5-8"];
const DAYS = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const GENDERS = ["male","female"];
const LAST_NAMES = ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schäfer","Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann","Braun","Krüger","Hofmann","Hartmann","Lange","Schmitt","Werner","Krause","Meier","Lehmann","Yilmaz","Kaya","Demir","Şahin","Çelik","Öztürk","Aydın","Yıldız","Özdemir","Arslan","Kowalski","Nowak","Ivanov","Petrov","Sokolov","Popov","Volkov","Kuznetsov","Shevchenko","Bondarenko","Kovalenko","Melnyk","Khan","Ahmed","Ali","Hussain","Malik","Sheikh"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randInt(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }

// Test user credentials for quick setup
const TEST_USERS = [
  { email: "owner@kinderstars.de", password: "KinderStars2024!", first_name: "Sarah", last_name: "Owner", role: "owner" },
  { email: "admin@kinderstars.de", password: "KinderStars2024!", first_name: "James", last_name: "Admin", role: "admin" },
  { email: "childminder@kinderstars.de", password: "KinderStars2024!", first_name: "Emma", last_name: "Childminder", role: "childminder" },
  { email: "parent@kinderstars.de", password: "KinderStars2024!", first_name: "Michael", last_name: "Parent", role: "parent" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Parse body
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  const { action } = body;

  // ── QUICK SETUP: Create test users (no auth required for this action) ──
  if (action === "setup_test_users") {
    const results: { email: string; password: string; role: string; success: boolean; error?: string }[] = [];
    
    for (const u of TEST_USERS) {
      // Check if user exists and delete if so
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);
      if (existing) {
        await admin.auth.admin.deleteUser(existing.id);
      }
      
      const { error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name, role: u.role },
      });
      
      results.push({
        email: u.email,
        password: u.password,
        role: u.role,
        success: !error,
        error: error?.message,
      });
    }
    
    return new Response(JSON.stringify({ success: true, users: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── CLEAR OLD USERS (except main owner) ──
  if (action === "clear_test_users") {
    const { data: allUsers } = await admin.auth.admin.listUsers();
    const deleted: string[] = [];
    const preserved = ["amersaleem@gmail.com"]; // Keep main owner
    
    for (const user of allUsers?.users || []) {
      if (preserved.includes(user.email || "")) continue;
      await admin.auth.admin.deleteUser(user.id);
      deleted.push(user.email || user.id);
    }
    
    return new Response(JSON.stringify({ success: true, deleted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── SEED ALL DATA (no auth required - uses service role) ──
  if (action === "seed_all") {
    const results: string[] = [];
    try {
      // Get test user IDs
      const { data: allAuthUsers } = await admin.auth.admin.listUsers();
      const cmUser = allAuthUsers?.users?.find((u: any) => u.email === "childminder@kinderstars.de");
      const parentUser = allAuthUsers?.users?.find((u: any) => u.email === "parent@kinderstars.de");
      const adminUser = allAuthUsers?.users?.find((u: any) => u.email === "admin@kinderstars.de");
      const ownerUser = allAuthUsers?.users?.find((u: any) => u.email === "amersaleem@gmail.com") || allAuthUsers?.users?.find((u: any) => u.email === "owner@kinderstars.de");

      // Ensure childminder profile exists
      if (cmUser) {
        const { data: existing } = await admin.from("childminder_profiles").select("id").eq("user_id", cmUser.id).maybeSingle();
        if (!existing) {
          await admin.from("childminder_profiles").insert({
            user_id: cmUser.id, town: "Berlin", postcode_district: "101",
            bio: "Herzliche Kindertagespflegeperson mit 8 Jahren Erfahrung.",
            experience_years: 8, age_groups: ["0-1","2-4","5-8"],
            days: ["Mon","Tue","Wed","Thu","Fri"], hours: "07:30–18:00",
            languages: ["English","Polish"], max_children: 4,
            ofsted_urn: "PE-B-2024-001", ofsted_rating: "verified",
            dbs_number: "FZ-2024-001234", is_available: true, is_live: true,
            onboarding_status: "verified",
          });
          results.push("Created childminder profile for test user");
        }
      }

      // Ensure parent profile + children exist
      if (parentUser) {
        const { data: existing } = await admin.from("parent_profiles").select("id").eq("user_id", parentUser.id).maybeSingle();
        if (!existing) {
          await admin.from("parent_profiles").insert({
            user_id: parentUser.id, address_line1: "Musterstraße 42", city: "Berlin",
            postcode: "10115", property_type: "Reihenhaus",
            has_pets: true, pet_details: "Ein freundlicher Labrador", parking_available: true,
            funding_type: "local_authority", local_authority: "Jugendamt Berlin-Mitte",
            payment_method: "SEPA-Überweisung",
          });
          results.push("Created parent profile for test user");
        }
        const { data: kids } = await admin.from("children").select("id").eq("parent_id", parentUser.id).limit(1);
        if (!kids?.length) {
          await admin.from("children").insert([
            { parent_id: parentUser.id, first_name: "Olivia", last_name: "Parent", date_of_birth: "2023-03-15", gender: "female", allergies: "Peanuts", emergency_contact_name: "Sarah Parent", emergency_contact_phone: "+49 30 12345678" },
            { parent_id: parentUser.id, first_name: "Noah", last_name: "Parent", date_of_birth: "2021-08-22", gender: "male", health_issues: "Mild asthma", emergency_contact_name: "Sarah Parent", emergency_contact_phone: "+49 30 12345678" },
          ]);
          results.push("Created children for test parent");
        }
      }

      // Seed messages between users
      if (adminUser && cmUser) {
        const { data: existingMsgs } = await admin.from("messages").select("id")
          .or(`sender_id.eq.${adminUser.id},recipient_id.eq.${adminUser.id}`).limit(1);
        if (!existingMsgs?.length) {
          await admin.from("messages").insert([
            { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Hallo Emma, willkommen bei KinderStars! Bitte vervollständige dein Profil." },
            { sender_id: cmUser.id, recipient_id: adminUser.id, content: "Danke! Ich habe meine Pflegeerlaubnis- und Führungszeugnis-Angaben eingetragen." },
            { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Super. Ich habe dir Einsätze für nächste Woche zugewiesen." },
          ]);
          results.push("Seeded messages");
        }
      }

      if (parentUser && cmUser) {
        const { data: existingMsgs } = await admin.from("messages").select("id")
          .eq("sender_id", parentUser.id).limit(1);
        if (!existingMsgs?.length) {
          await admin.from("messages").insert([
            { sender_id: parentUser.id, recipient_id: cmUser.id, content: "Hallo Emma, ich würde dich gerne für nächsten Montag buchen, wenn du verfügbar bist." },
            { sender_id: cmUser.id, recipient_id: parentUser.id, content: "Hallo Michael, ja, ich bin verfügbar! Mo 8:00–17:00 passt mir." },
            { sender_id: parentUser.id, recipient_id: cmUser.id, content: "Perfekt, ich sende die Buchungsanfrage jetzt ab. Danke!" },
          ]);
          results.push("Seeded parent-childminder messages");
        }
      }

      // Seed bookings
      if (parentUser && cmUser) {
        const { data: existingBookings } = await admin.from("bookings").select("id").eq("parent_id", parentUser.id).limit(1);
        if (!existingBookings?.length) {
          await admin.from("bookings").insert([
            { parent_id: parentUser.id, childminder_id: cmUser.id, booking_date: "2026-03-10", start_time: "08:00", end_time: "17:00", status: "confirmed", notes: "Olivia - bring packed lunch" },
            { parent_id: parentUser.id, childminder_id: cmUser.id, booking_date: "2026-03-12", start_time: "09:00", end_time: "15:00", status: "pending", notes: "Both children" },
          ]);
          results.push("Seeded bookings");
        }
      }

      // Seed notifications
      if (cmUser) {
        const { data: existingNotifs } = await admin.from("notifications").select("id").eq("user_id", cmUser.id).limit(1);
        if (!existingNotifs?.length) {
          await admin.from("notifications").insert([
            { user_id: cmUser.id, title: "New booking request", body: "Michael Parent has requested a booking for Mon 10 Mar", type: "booking", link: "/childminder/bookings" },
            { user_id: cmUser.id, title: "Profile approved", body: "Your profile has been verified. You can now accept shifts!", type: "info" },
          ]);
          results.push("Seeded childminder notifications");
        }
      }
      if (parentUser) {
        const { data: existingNotifs } = await admin.from("notifications").select("id").eq("user_id", parentUser.id).limit(1);
        if (!existingNotifs?.length) {
          await admin.from("notifications").insert([
            { user_id: parentUser.id, title: "Booking confirmed", body: "Emma Childminder confirmed your booking for Mon 10 Mar", type: "booking", link: "/parent/bookings" },
            { user_id: parentUser.id, title: "Welcome to KinderStars!", body: "Complete your profile and add your children to get started.", type: "info" },
          ]);
          results.push("Seeded parent notifications");
        }
      }

      // Seed bulk parent/childminder profiles for admin dashboard
      const { count: parentCount } = await admin.from("parent_profiles").select("*", { count: "exact", head: true });
      const parentsNeeded = Math.min(50, 50 - (parentCount ?? 0));
      if (parentsNeeded > 0) {
        const profileBatch: any[] = [];
        const parentBatch: any[] = [];
        const childBatch: any[] = [];
        for (let i = 0; i < parentsNeeded; i++) {
          const userId = crypto.randomUUID();
          const loc = pick(UK_LOCATIONS);
          const firstName = pick([...FIRST_NAMES_F, ...FIRST_NAMES_M]);
          const lastName = pick(LAST_NAMES);
          profileBatch.push({
            user_id: userId, first_name: firstName, last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1,9999)}@demo.kinderstars.de`,
            role: "parent",
          });
          parentBatch.push({
            user_id: userId,
            address_line1: `${pick(["Haupt","Bahnhof","Garten","Kirch","Berg","Wald","Schul","Linden","Markt","Mühlen"])}${pick(["straße","weg","allee","platz"])} ${randInt(1,200)}`,
            city: loc.town, postcode: `${pick(loc.districts)}${randInt(10,99)}`,
            property_type: pick(["Detached","Reihenhaus","Terraced","Flat/Apartment"]),
            funding_type: pick(["self_funded","jugendamt","employer"]),
          });
          childBatch.push({
            parent_id: userId,
            first_name: pick([...FIRST_NAMES_F, ...FIRST_NAMES_M]),
            last_name: lastName, date_of_birth: new Date(2026 - randInt(0,5), randInt(0,11), randInt(1,28)).toISOString().split("T")[0],
            gender: pick(GENDERS),
          });
        }
        await admin.from("profiles").insert(profileBatch);
        await admin.from("parent_profiles").insert(parentBatch);
        await admin.from("children").insert(childBatch);
        results.push(`Seeded ${parentsNeeded} demo parents`);
      }

      // Seed bulk childminder profiles
      const { count: cmProfCount } = await admin.from("childminder_profiles").select("*", { count: "exact", head: true });
      const cmProfsNeeded = Math.min(30, 30 - (cmProfCount ?? 0));
      if (cmProfsNeeded > 0) {
        const profBatch: any[] = [];
        const cmProfBatch: any[] = [];
        for (let i = 0; i < cmProfsNeeded; i++) {
          const userId = crypto.randomUUID();
          const loc = pick(UK_LOCATIONS);
          const firstName = pick(FIRST_NAMES_F);
          const lastName = pick(LAST_NAMES);
          profBatch.push({
            user_id: userId, first_name: firstName, last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.cm${randInt(1,9999)}@demo.kinderstars.de`,
            role: "childminder",
          });
          cmProfBatch.push({
            user_id: userId, town: loc.town, postcode_district: pick(loc.districts),
            languages: ["English"], age_groups: pickN(AGE_GROUPS,1,3), days: pickN(DAYS,3,6),
            hours: pick(["07:00–18:00","08:00–17:00"]),
            experience_years: randInt(1,20),
            onboarding_status: pick(["pending","submitted","verified","verified"]),
            is_live: Math.random()>0.4, is_available: Math.random()>0.2, max_children: randInt(2,6),
          });
        }
        await admin.from("profiles").insert(profBatch);
        await admin.from("childminder_profiles").insert(cmProfBatch);
        results.push(`Seeded ${cmProfsNeeded} demo childminder profiles`);
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err), results }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // For other actions, require authentication
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized", hint: "Use action: 'setup_test_users', 'clear_test_users', or 'seed_all'" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify admin role
  const { data: roleData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: string[] = [];

  try {
    // ── 1. CREATE DEMO AUTH USERS ──
    const demoUsers = [
      { email: "admin@kinderstars.demo", password: "Demo1234!", first_name: "Admin", last_name: "User", role: "admin" },
      { email: "childminder@kinderstars.demo", password: "Demo1234!", first_name: "Sarah", last_name: "Williams", role: "childminder" },
      { email: "parent@kinderstars.demo", password: "Demo1234!", first_name: "James", last_name: "Thompson", role: "parent" },
    ];

    for (const u of demoUsers) {
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing?.users?.find((x: any) => x.email === u.email);
      if (found) {
        results.push(`${u.role}: exists (${u.email})`);
      } else {
        const { error } = await admin.auth.admin.createUser({
          email: u.email, password: u.password, email_confirm: true,
          user_metadata: { first_name: u.first_name, last_name: u.last_name, role: u.role },
        });
        results.push(error ? `${u.role}: ERROR ${error.message}` : `${u.role}: created`);
      }
    }

    // Get actual user IDs for demo users
    const { data: allAuthUsers } = await admin.auth.admin.listUsers();
    const adminUser = allAuthUsers?.users?.find((u: any) => u.email === "admin@kinderstars.demo");
    const cmUser = allAuthUsers?.users?.find((u: any) => u.email === "childminder@kinderstars.demo");
    const parentUser = allAuthUsers?.users?.find((u: any) => u.email === "parent@kinderstars.demo");

    // Ensure childminder profile exists for demo user
    if (cmUser) {
      const { data: existing } = await admin.from("childminder_profiles").select("id").eq("user_id", cmUser.id).maybeSingle();
      if (!existing) {
        await admin.from("childminder_profiles").insert({
          user_id: cmUser.id, town: "Berlin", postcode_district: "101",
          bio: "Herzliche Kindertagespflegeperson mit 8 Jahren Erfahrung.",
          experience_years: 8, age_groups: ["0-1","2-4","5-8"],
          days: ["Mon","Tue","Wed","Thu","Fri"], hours: "07:30–18:00",
          languages: ["English","Polish"], max_children: 4,
          ofsted_urn: "PE-B-2024-001", ofsted_rating: "verified",
          dbs_number: "FZ-2024-001234", is_available: true, is_live: true,
          onboarding_status: "verified",
        });
      }
    }

    // Ensure parent profile exists for demo user
    if (parentUser) {
      const { data: existing } = await admin.from("parent_profiles").select("id").eq("user_id", parentUser.id).maybeSingle();
      if (!existing) {
        await admin.from("parent_profiles").insert({
          user_id: parentUser.id, address_line1: "Musterstraße 42", city: "Berlin",
          postcode: "10115", property_type: "Reihenhaus",
          has_pets: true, pet_details: "Ein freundlicher Labrador", parking_available: true,
          funding_type: "local_authority", local_authority: "Jugendamt Berlin-Mitte",
          payment_method: "SEPA-Überweisung",
        });
      }
      // Seed children for demo parent
      const { data: kids } = await admin.from("children").select("id").eq("parent_id", parentUser.id).limit(1);
      if (!kids?.length) {
        await admin.from("children").insert([
          { parent_id: parentUser.id, first_name: "Olivia", last_name: "Thompson", date_of_birth: "2023-03-15", gender: "female", allergies: "Peanuts", emergency_contact_name: "Emma Thompson", emergency_contact_phone: "+49 30 12345678" },
          { parent_id: parentUser.id, first_name: "Noah", last_name: "Thompson", date_of_birth: "2021-08-22", gender: "male", health_issues: "Mild asthma", emergency_contact_name: "Emma Thompson", emergency_contact_phone: "+49 30 12345678" },
        ]);
      }
    }

    // ── 2. SEED CHILDMINDERS DIRECTORY (target: 600) ──
    const { count: cmCount } = await admin.from("childminders").select("*", { count: "exact", head: true });
    const cmNeeded = 600 - (cmCount ?? 0);
    if (cmNeeded > 0) {
      for (let c = 0; c < cmNeeded; c += 100) {
        const batch: any[] = [];
        const batchSize = Math.min(100, cmNeeded - c);
        for (let i = 0; i < batchSize; i++) {
          const loc = pick(UK_LOCATIONS);
          const district = pick(loc.districts);
          batch.push({
            id: `KS-${district}-${String((cmCount ?? 0) + c + i + 1).padStart(3, "0")}`,
            first_name: pick(FIRST_NAMES_F),
            last_initial: pick(LAST_INITIALS.split("")),
            town: loc.town, postcode_district: district,
            verified: Math.random() > 0.25,
            age_groups: pickN(AGE_GROUPS, 1, 3),
            days: pickN(DAYS, 3, 7),
            hours: pick(["07:00–18:00","08:00–17:00","07:30–18:30","06:00–19:00","08:00–16:00"]),
            languages: ["Deutsch", ...pickN(LANGUAGES.filter(l => l !== "Deutsch"), 0, 2)],
            experience_years: randInt(1, 25),
            bio: pick(["Herzliche Umgebung mit kreativem Spiel.","Jugendamt-anerkannt, inklusiv arbeitend.","Strukturierte Betreuung mit gesunden Mahlzeiten.","Flexible Zeiten, sicheres Zuhause.","Naturpädagogin mit Waldgruppen-Erfahrung.",null]),
          });
        }
        const { error } = await admin.from("childminders").insert(batch);
        if (error) results.push(`childminders batch error: ${error.message}`);
      }
      results.push(`Seeded ${cmNeeded} childminders`);
    } else {
      results.push(`Childminders: ${cmCount} already exists`);
    }

    // ── 3. SEED PARENT PROFILES (target: 450) + CHILDREN (target: ~500) ──
    const { count: parentCount } = await admin.from("parent_profiles").select("*", { count: "exact", head: true });
    const parentsNeeded = 450 - (parentCount ?? 0);
    if (parentsNeeded > 0) {
      let totalChildren = 0;
      for (let c = 0; c < parentsNeeded; c += 50) {
        const profileBatch: any[] = [];
        const parentBatch: any[] = [];
        const childBatch: any[] = [];
        const batchSize = Math.min(50, parentsNeeded - c);

        for (let i = 0; i < batchSize; i++) {
          const userId = crypto.randomUUID();
          const loc = pick(UK_LOCATIONS);
          const firstName = pick([...FIRST_NAMES_F, ...FIRST_NAMES_M]);
          const lastName = pick(LAST_NAMES);

          profileBatch.push({
            user_id: userId, first_name: firstName, last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1,9999)}@demo.kinderstars.de`,
            role: "parent", phone: `+4930${randInt(1000000,9999999)}`,
          });

          parentBatch.push({
            user_id: userId,
            address_line1: `${pick(["Haupt","Bahnhof","Garten","Kirch","Berg","Wald","Schul","Linden","Markt","Mühlen","Rosen","Eichen","Ahorn","Birken"])}${pick(["straße","weg","allee","platz","ring"])} ${randInt(1,200)}`,
            city: loc.town, postcode: `${pick(loc.districts)}${randInt(10,99)}`,
            property_type: pick(["Detached","Reihenhaus","Terraced","Flat/Apartment","Bungalow"]),
            has_pets: Math.random() > 0.65,
            pet_details: Math.random() > 0.65 ? pick(["Freundliche Katze","Kleiner Hund","Meerschweinchen","Kaninchen","Fische"]) : null,
            parking_available: Math.random() > 0.3,
            funding_type: pick(["self_funded","self_funded","jugendamt","bafoeg","employer"]),
            payment_method: pick(["Direct Debit","SEPA-Überweisung","Credit/Debit Card","Childcare Vouchers"]),
          });

          const numChildren = Math.random() > 0.55 ? 2 : 1;
          for (let ch = 0; ch < numChildren; ch++) {
            const g = pick(GENDERS);
            const dob = new Date(2026 - randInt(0,7), randInt(0,11), randInt(1,28));
            childBatch.push({
              parent_id: userId,
              first_name: pick(g === "female" ? FIRST_NAMES_F : FIRST_NAMES_M),
              last_name: lastName, date_of_birth: dob.toISOString().split("T")[0], gender: g,
              allergies: Math.random() > 0.8 ? pick(["Erdnüsse","Milch","Eier","Gluten"]) : null,
              dietary_requirements: Math.random() > 0.85 ? pick(["Vegetarisch","Halal","Vegan"]) : null,
              health_issues: Math.random() > 0.9 ? pick(["Asthma","Neurodermitis","Epilepsie"]) : null,
              special_needs: Math.random() > 0.92 ? pick(["Autismus","ADHS","Sprachentwicklungsverzögerung"]) : null,
              emergency_contact_name: `${pick([...FIRST_NAMES_F,...FIRST_NAMES_M])} ${lastName}`,
              emergency_contact_phone: `+4930${randInt(1000000,9999999)}`,
            });
          }
          totalChildren += numChildren;
        }

        const { error: e1 } = await admin.from("profiles").insert(profileBatch);
        if (e1) results.push(`profiles error: ${e1.message}`);
        const { error: e2 } = await admin.from("parent_profiles").insert(parentBatch);
        if (e2) results.push(`parent_profiles error: ${e2.message}`);
        const { error: e3 } = await admin.from("children").insert(childBatch);
        if (e3) results.push(`children error: ${e3.message}`);
      }
      results.push(`Seeded ${parentsNeeded} parents with ~${totalChildren} children`);
    }

    // ── 4. SEED CHILDMINDER PROFILES (registered minders, target: 150) ──
    const { count: cmProfCount } = await admin.from("childminder_profiles").select("*", { count: "exact", head: true });
    const cmProfsNeeded = 150 - (cmProfCount ?? 0);
    if (cmProfsNeeded > 0) {
      for (let c = 0; c < cmProfsNeeded; c += 50) {
        const profBatch: any[] = [];
        const cmProfBatch: any[] = [];
        const batchSize = Math.min(50, cmProfsNeeded - c);
        for (let i = 0; i < batchSize; i++) {
          const userId = crypto.randomUUID();
          const loc = pick(UK_LOCATIONS);
          const firstName = pick(FIRST_NAMES_F);
          const lastName = pick(LAST_NAMES);
          profBatch.push({
            user_id: userId, first_name: firstName, last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.cm${randInt(1,9999)}@demo.kinderstars.de`,
            role: "childminder",
          });
          cmProfBatch.push({
            user_id: userId, town: loc.town, postcode_district: pick(loc.districts),
            languages: ["Deutsch",...pickN(LANGUAGES.filter(l=>l!=="Deutsch"),0,2)],
            age_groups: pickN(AGE_GROUPS,1,3), days: pickN(DAYS,3,6),
            hours: pick(["07:00–18:00","08:00–17:00"]),
            experience_years: randInt(1,20),
            dbs_number: Math.random()>0.3 ? `FZ-${randInt(100000,999999)}` : null,
            ofsted_urn: Math.random()>0.35 ? `PE-${randInt(100000,999999)}` : null,
            onboarding_status: pick(["pending","submitted","interview_scheduled","verified","verified","verified"]),
            is_live: Math.random()>0.4, is_available: Math.random()>0.2, max_children: randInt(2,6),
          });
        }
        const { error: e1 } = await admin.from("profiles").insert(profBatch);
        if (e1) results.push(`cm prof error: ${e1.message}`);
        const { error: e2 } = await admin.from("childminder_profiles").insert(cmProfBatch);
        if (e2) results.push(`cm_profiles error: ${e2.message}`);
      }
      results.push(`Seeded ${cmProfsNeeded} childminder profiles`);
    }

    // Seed messages between demo users
    if (adminUser && cmUser) {
      const { data: existingMsgs } = await admin.from("messages").select("id")
        .or(`sender_id.eq.${adminUser.id},recipient_id.eq.${adminUser.id}`).limit(1);
      if (!existingMsgs?.length) {
        await admin.from("messages").insert([
          { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Hallo Sarah, willkommen bei KinderStars! Bitte vervollständige dein Profil." },
          { sender_id: cmUser.id, recipient_id: adminUser.id, content: "Danke! Ich habe meine Pflegeerlaubnis- und Führungszeugnis-Angaben eingetragen." },
          { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Super. Ich habe dir Einsätze für nächste Woche zugewiesen." },
        ]);
      }
    }

    return new Response(JSON.stringify({ success: true, results, note: "Demo logins: admin/childminder/parent@kinderstars.demo / Demo1234!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), results }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
