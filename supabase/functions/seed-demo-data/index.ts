import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UK towns with realistic postcode districts
const UK_LOCATIONS = [
  { town: "London", districts: ["E1","E2","N1","N4","SE1","SE5","SW1","SW4","W1","W2","NW1","NW3","EC1","WC1"] },
  { town: "Birmingham", districts: ["B1","B2","B5","B11","B14","B16","B23","B29","B31","B33"] },
  { town: "Manchester", districts: ["M1","M2","M4","M8","M11","M14","M16","M20","M21","M23"] },
  { town: "Leeds", districts: ["LS1","LS2","LS4","LS6","LS7","LS8","LS11","LS15","LS17"] },
  { town: "Liverpool", districts: ["L1","L2","L3","L4","L7","L8","L11","L15","L17","L18"] },
  { town: "Bristol", districts: ["BS1","BS2","BS3","BS5","BS6","BS7","BS8","BS9","BS10"] },
  { town: "Sheffield", districts: ["S1","S2","S3","S5","S7","S8","S10","S11","S12"] },
  { town: "Newcastle", districts: ["NE1","NE2","NE3","NE4","NE5","NE6","NE7","NE12"] },
  { town: "Nottingham", districts: ["NG1","NG2","NG3","NG5","NG7","NG8","NG9","NG11"] },
  { town: "Leicester", districts: ["LE1","LE2","LE3","LE4","LE5","LE7","LE8"] },
  { town: "Coventry", districts: ["CV1","CV2","CV3","CV4","CV5","CV6"] },
  { town: "Southampton", districts: ["SO14","SO15","SO16","SO17","SO18","SO19"] },
  { town: "Brighton", districts: ["BN1","BN2","BN3"] },
  { town: "Plymouth", districts: ["PL1","PL2","PL3","PL4","PL5","PL6"] },
  { town: "Reading", districts: ["RG1","RG2","RG4","RG6","RG30"] },
  { town: "Derby", districts: ["DE1","DE3","DE21","DE22","DE23","DE24"] },
  { town: "Luton", districts: ["LU1","LU2","LU3","LU4"] },
  { town: "Milton Keynes", districts: ["MK1","MK2","MK3","MK5","MK9","MK10"] },
  { town: "Northampton", districts: ["NN1","NN2","NN3","NN4","NN5"] },
  { town: "Oxford", districts: ["OX1","OX2","OX3","OX4"] },
  { town: "Cambridge", districts: ["CB1","CB2","CB3","CB4","CB5"] },
  { town: "Norwich", districts: ["NR1","NR2","NR3","NR4","NR5","NR6"] },
  { town: "York", districts: ["YO1","YO10","YO23","YO24","YO26","YO30"] },
  { town: "Bath", districts: ["BA1","BA2"] },
  { town: "Exeter", districts: ["EX1","EX2","EX4"] },
  { town: "Cardiff", districts: ["CF10","CF11","CF14","CF24"] },
  { town: "Edinburgh", districts: ["EH1","EH3","EH4","EH6","EH7","EH10"] },
  { town: "Glasgow", districts: ["G1","G2","G3","G4","G11","G12","G20","G41"] },
  { town: "Aberdeen", districts: ["AB10","AB11","AB15","AB24","AB25"] },
  { town: "Swindon", districts: ["SN1","SN2","SN3","SN5","SN25"] },
  { town: "Peterborough", districts: ["PE1","PE2","PE3","PE4"] },
  { town: "Ipswich", districts: ["IP1","IP2","IP3","IP4"] },
  { town: "Stoke-on-Trent", districts: ["ST1","ST2","ST3","ST4","ST6"] },
  { town: "Wolverhampton", districts: ["WV1","WV2","WV3","WV4","WV6","WV10"] },
  { town: "Sunderland", districts: ["SR1","SR2","SR3","SR4","SR5"] },
  { town: "Bournemouth", districts: ["BH1","BH2","BH5","BH8","BH9"] },
  { town: "Cheltenham", districts: ["GL50","GL51","GL52","GL53"] },
  { town: "Colchester", districts: ["CO1","CO2","CO3","CO4"] },
  { town: "Blackpool", districts: ["FY1","FY2","FY3","FY4"] },
  { town: "Swansea", districts: ["SA1","SA2","SA3","SA4","SA5"] },
];

const FIRST_NAMES_F = ["Emma","Olivia","Sophie","Amelia","Isla","Ava","Mia","Isabella","Evie","Ella","Grace","Lily","Charlotte","Hannah","Freya","Jessica","Ruby","Emily","Daisy","Phoebe","Alice","Lucy","Chloe","Poppy","Florence","Sienna","Matilda","Rosie","Layla","Maisie","Willow","Ivy","Harper","Aria","Scarlett","Eva","Elsie","Millie","Georgia","Eliza","Bella","Lola","Molly","Jasmine","Imogen","Zara","Thea","Iris","Holly","Clara"];
const FIRST_NAMES_M = ["Oliver","George","Harry","Noah","Jack","Leo","Arthur","Charlie","Oscar","James","Jacob","Henry","Thomas","William","Alfie","Teddy","Freddie","Archie","Joshua","Alexander","Lucas","Theo","Edward","Isaac","Max","Ethan","Logan","Joseph","Samuel","Daniel","Sebastian","Adam","Liam","Benjamin","Ryan","Dylan","Nathan","Matthew","Luke","Finley"];
const LAST_INITIALS = "ABCDEFGHJKLMNOPRSTUVW";
const LANGUAGES = ["English","Welsh","Polish","Urdu","Arabic","Romanian","Czech","Slovak","Gujarati","Punjabi","Bengali","Hindi","Mandarin","French","Spanish","Portuguese","Italian","German","Turkish","Somali"];
const AGE_GROUPS = ["0-1","2-4","5-8"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const GENDERS = ["male","female"];
const LAST_NAMES = ["Smith","Jones","Williams","Taylor","Brown","Davies","Wilson","Evans","Johnson","Roberts","Walker","Wright","Thompson","White","Robinson","Hall","Green","Lewis","Clarke","Jackson","Harris","Wood","Turner","Martin","Cooper","Hill","Ward","Hughes","Moore","King","Baker","Harrison","Morgan","Allen","James","Scott","Phillips","Watson","Davis","Parker","Price","Bennett","Young","Griffiths","Mitchell","Kelly","Cook","Carter","Richardson","Bailey","Collins","Shaw","Murphy","Miller","Cox","Richards","Khan","Marshall","Anderson","Simpson"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randInt(min: number, max: number) { return min + Math.floor(Math.random() * (max - min + 1)); }

// Test user credentials for quick setup
const TEST_USERS = [
  { email: "owner@kinderstars.co.uk", password: "KinderStars2024!", first_name: "Sarah", last_name: "Owner", role: "owner" },
  { email: "admin@kinderstars.co.uk", password: "KinderStars2024!", first_name: "James", last_name: "Admin", role: "admin" },
  { email: "childminder@kinderstars.co.uk", password: "KinderStars2024!", first_name: "Emma", last_name: "Childminder", role: "childminder" },
  { email: "parent@kinderstars.co.uk", password: "KinderStars2024!", first_name: "Michael", last_name: "Parent", role: "parent" },
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
      const cmUser = allAuthUsers?.users?.find((u: any) => u.email === "childminder@kinderstars.co.uk");
      const parentUser = allAuthUsers?.users?.find((u: any) => u.email === "parent@kinderstars.co.uk");
      const adminUser = allAuthUsers?.users?.find((u: any) => u.email === "admin@kinderstars.co.uk");
      const ownerUser = allAuthUsers?.users?.find((u: any) => u.email === "amersaleem@gmail.com") || allAuthUsers?.users?.find((u: any) => u.email === "owner@kinderstars.co.uk");

      // Ensure childminder profile exists
      if (cmUser) {
        const { data: existing } = await admin.from("childminder_profiles").select("id").eq("user_id", cmUser.id).maybeSingle();
        if (!existing) {
          await admin.from("childminder_profiles").insert({
            user_id: cmUser.id, town: "Luton", postcode_district: "LU1",
            bio: "Warm, nurturing childminder with 8 years of experience.",
            experience_years: 8, age_groups: ["0-1","2-4","5-8"],
            days: ["Mon","Tue","Wed","Thu","Fri"], hours: "07:30–18:00",
            languages: ["English","Polish"], max_children: 4,
            ofsted_urn: "EY123456", ofsted_rating: "Good",
            dbs_number: "001234567890", is_available: true, is_live: true,
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
            user_id: parentUser.id, address_line1: "42 Oak Avenue", city: "Luton",
            postcode: "LU1 3PE", property_type: "Semi-detached",
            has_pets: true, pet_details: "One friendly Labrador", parking_available: true,
            funding_type: "local_authority", local_authority: "Luton Borough Council",
            payment_method: "Bank Transfer",
          });
          results.push("Created parent profile for test user");
        }
        const { data: kids } = await admin.from("children").select("id").eq("parent_id", parentUser.id).limit(1);
        if (!kids?.length) {
          await admin.from("children").insert([
            { parent_id: parentUser.id, first_name: "Olivia", last_name: "Parent", date_of_birth: "2023-03-15", gender: "female", allergies: "Peanuts", emergency_contact_name: "Sarah Parent", emergency_contact_phone: "07700900456" },
            { parent_id: parentUser.id, first_name: "Noah", last_name: "Parent", date_of_birth: "2021-08-22", gender: "male", health_issues: "Mild asthma", emergency_contact_name: "Sarah Parent", emergency_contact_phone: "07700900456" },
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
            { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Hi Emma, welcome to KinderStars! Please complete your profile." },
            { sender_id: cmUser.id, recipient_id: adminUser.id, content: "Thank you! I've filled in my Ofsted and DBS details." },
            { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Great. I've assigned you shifts for next week." },
          ]);
          results.push("Seeded messages");
        }
      }

      if (parentUser && cmUser) {
        const { data: existingMsgs } = await admin.from("messages").select("id")
          .eq("sender_id", parentUser.id).limit(1);
        if (!existingMsgs?.length) {
          await admin.from("messages").insert([
            { sender_id: parentUser.id, recipient_id: cmUser.id, content: "Hi Emma, I'd like to book you for next Monday if available?" },
            { sender_id: cmUser.id, recipient_id: parentUser.id, content: "Hi Michael, yes I'm available! Mon 8am-5pm works for me." },
            { sender_id: parentUser.id, recipient_id: cmUser.id, content: "Perfect, I'll submit the booking now. Thanks!" },
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
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1,9999)}@demo.kinderstars.uk`,
            role: "parent",
          });
          parentBatch.push({
            user_id: userId,
            address_line1: `${randInt(1,200)} ${pick(["Oak","Elm","High","Church","Station","Park"])} ${pick(["Street","Road","Lane","Avenue"])}`,
            city: loc.town, postcode: `${pick(loc.districts)} ${randInt(1,9)}${pick("ABCDEFGHJKLMNPRSTUVWXYZ".split(""))}${pick("ABCDEFGHJKLMNPRSTUVWXYZ".split(""))}`,
            property_type: pick(["Detached","Semi-detached","Terraced","Flat/Apartment"]),
            funding_type: pick(["self_funded","local_authority","tax_free_childcare"]),
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
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.cm${randInt(1,9999)}@demo.kinderstars.uk`,
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
          user_id: cmUser.id, town: "Luton", postcode_district: "LU1",
          bio: "Warm, nurturing childminder with 8 years of experience.",
          experience_years: 8, age_groups: ["0-1","2-4","5-8"],
          days: ["Mon","Tue","Wed","Thu","Fri"], hours: "07:30–18:00",
          languages: ["English","Polish"], max_children: 4,
          ofsted_urn: "EY123456", ofsted_rating: "Good",
          dbs_number: "001234567890", is_available: true, is_live: true,
          onboarding_status: "verified",
        });
      }
    }

    // Ensure parent profile exists for demo user
    if (parentUser) {
      const { data: existing } = await admin.from("parent_profiles").select("id").eq("user_id", parentUser.id).maybeSingle();
      if (!existing) {
        await admin.from("parent_profiles").insert({
          user_id: parentUser.id, address_line1: "42 Oak Avenue", city: "Luton",
          postcode: "LU1 3PE", property_type: "Semi-detached",
          has_pets: true, pet_details: "One friendly Labrador", parking_available: true,
          funding_type: "local_authority", local_authority: "Luton Borough Council",
          payment_method: "Bank Transfer",
        });
      }
      // Seed children for demo parent
      const { data: kids } = await admin.from("children").select("id").eq("parent_id", parentUser.id).limit(1);
      if (!kids?.length) {
        await admin.from("children").insert([
          { parent_id: parentUser.id, first_name: "Olivia", last_name: "Thompson", date_of_birth: "2023-03-15", gender: "female", allergies: "Peanuts", emergency_contact_name: "Emma Thompson", emergency_contact_phone: "07700900456" },
          { parent_id: parentUser.id, first_name: "Noah", last_name: "Thompson", date_of_birth: "2021-08-22", gender: "male", health_issues: "Mild asthma", emergency_contact_name: "Emma Thompson", emergency_contact_phone: "07700900456" },
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
            languages: ["English", ...pickN(LANGUAGES.filter(l => l !== "English"), 0, 2)],
            experience_years: randInt(1, 25),
            bio: pick(["Warm, nurturing environment with creative play.","Ofsted Outstanding. SEND-trained.","Fun, structured care with healthy meals.","Flexible hours, safe home setting.","Forest school practitioner.",null]),
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
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1,9999)}@demo.kinderstars.uk`,
            role: "parent", phone: `07${randInt(100,999)}${randInt(100,999)}${randInt(100,999)}`,
          });

          parentBatch.push({
            user_id: userId,
            address_line1: `${randInt(1,200)} ${pick(["Oak","Elm","High","Church","Station","Park","Victoria","Mill","Bridge","Green"])} ${pick(["Street","Road","Lane","Avenue","Close","Way","Drive"])}`,
            city: loc.town, postcode: `${pick(loc.districts)} ${randInt(1,9)}${pick("ABCDEFGHJKLMNPRSTUVWXYZ".split(""))}${pick("ABCDEFGHJKLMNPRSTUVWXYZ".split(""))}`,
            property_type: pick(["Detached","Semi-detached","Terraced","Flat/Apartment","Bungalow"]),
            has_pets: Math.random() > 0.65,
            pet_details: Math.random() > 0.65 ? pick(["Friendly cat","Small dog","Guinea pigs","Rabbit","Fish"]) : null,
            parking_available: Math.random() > 0.3,
            funding_type: pick(["self_funded","self_funded","local_authority","tax_free_childcare","sfe","employer"]),
            payment_method: pick(["Direct Debit","Bank Transfer","Credit/Debit Card","Childcare Vouchers"]),
          });

          const numChildren = Math.random() > 0.55 ? 2 : 1;
          for (let ch = 0; ch < numChildren; ch++) {
            const g = pick(GENDERS);
            const dob = new Date(2026 - randInt(0,7), randInt(0,11), randInt(1,28));
            childBatch.push({
              parent_id: userId,
              first_name: pick(g === "female" ? FIRST_NAMES_F : FIRST_NAMES_M),
              last_name: lastName, date_of_birth: dob.toISOString().split("T")[0], gender: g,
              allergies: Math.random() > 0.8 ? pick(["Peanuts","Dairy","Eggs","Gluten"]) : null,
              dietary_requirements: Math.random() > 0.85 ? pick(["Vegetarian","Halal","Vegan"]) : null,
              health_issues: Math.random() > 0.9 ? pick(["Asthma","Eczema","Epilepsy"]) : null,
              special_needs: Math.random() > 0.92 ? pick(["ASD","ADHD","Speech delay"]) : null,
              emergency_contact_name: `${pick([...FIRST_NAMES_F,...FIRST_NAMES_M])} ${lastName}`,
              emergency_contact_phone: `07${randInt(100,999)}${randInt(100,999)}${randInt(100,999)}`,
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
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.cm${randInt(1,9999)}@demo.kinderstars.uk`,
            role: "childminder",
          });
          cmProfBatch.push({
            user_id: userId, town: loc.town, postcode_district: pick(loc.districts),
            languages: ["English",...pickN(LANGUAGES.filter(l=>l!=="English"),0,1)],
            age_groups: pickN(AGE_GROUPS,1,3), days: pickN(DAYS,3,6),
            hours: pick(["07:00–18:00","08:00–17:00"]),
            experience_years: randInt(1,20),
            dbs_number: Math.random()>0.3 ? `DBS${randInt(100000,999999)}` : null,
            ofsted_urn: Math.random()>0.35 ? `EY${randInt(100000,999999)}` : null,
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
          { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Hi Sarah, welcome to KinderStars! Please complete your profile." },
          { sender_id: cmUser.id, recipient_id: adminUser.id, content: "Thank you! I've filled in my Ofsted and DBS details." },
          { sender_id: adminUser.id, recipient_id: cmUser.id, content: "Great. I've assigned you shifts for next week." },
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
