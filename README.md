# KINDERSTARS

build a website for kinderstars use logo and code <!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="KinderStars Ltd – Childminder Agency. Parent-first childcare directory and enquiries." />
  <title>KinderStars – Childminder Agency</title>

  <style>
    :root{
      /* Logo-matched palette + Parent-first warmth */
      --brand:#034d72;
      --brandNavy:#01123f;
      --accent:#f7c22a;

      --bg:#fffaf1;
      --bg2:#ffffff;
      --card:#ffffff;

      --text:#142033;
      --muted: rgba(20,32,51,.70);

      --stroke: rgba(1,18,63,.10);
      --shadow: 0 18px 40px rgba(1,18,63,.10);

      --radius: 22px;
      --radius2: 16px;
      --max: 1120px;
      --focus: rgba(3,77,114,.18);

      --danger: #b42318;
      --ok: #067647;
    }

    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji","Segoe UI Emoji";
      color: var(--text);
      line-height:1.55;
      background:
        radial-gradient(900px 520px at 10% 0%, rgba(247,194,42,.22), transparent 60%),
        radial-gradient(900px 520px at 90% 20%, rgba(3,77,114,.12), transparent 60%),
        linear-gradient(180deg, var(--bg), var(--bg2));
    }
    a{color:inherit}
    .wrap{max-width:var(--max); margin:0 auto; padding:24px}

    /* Top bar */
    .topbar{
      position:sticky; top:0; z-index:50;
      backdrop-filter: blur(10px);
      background: rgba(255,250,241,.82);
      border-bottom: 1px solid var(--stroke);
    }
    .nav{
      max-width:var(--max);
      margin:0 auto;
      padding:12px 24px;
      display:flex; align-items:center; justify-content:space-between;
      gap:14px;
      flex-wrap:wrap;
    }
    .brand{display:flex; align-items:center; gap:12px; text-decoration:none;}
    .brand img{
      width:165px; height:auto; display:block;
      filter: drop-shadow(0 10px 16px rgba(1,18,63,.10));
    }
    .navlinks{display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
    .navlinks a{
      text-decoration:none;
      color: var(--muted);
      padding:8px 10px;
      border-radius: 12px;
      border:1px solid transparent;
    }
    .navlinks a:hover{
      color: var(--text);
      border-color: var(--stroke);
      background: rgba(255,255,255,.65);
    }

    /* Buttons */
    .btn{
      display:inline-flex; align-items:center; justify-content:center;
      gap:10px;
      padding:11px 14px;
      border-radius: 14px;
      border:1px solid rgba(247,194,42,.45);
      background: rgba(247,194,42,.14);
      color: var(--text);
      text-decoration:none;
      cursor:pointer;
      transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
      white-space:nowrap;
    }
    .btn:hover{
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(1,18,63,.08);
      background: rgba(247,194,42,.18);
    }
    .btn.primary{
      border-color: rgba(247,194,42,.70);
      background: linear-gradient(135deg, #f7c22a, #fff2bf);
      color: #172235;
      font-weight:800;
    }
    .btn.ghost{
      border-color: rgba(3,77,114,.18);
      background: rgba(3,77,114,.06);
    }
    .btn.danger{
      border-color: rgba(180,35,24,.30);
      background: rgba(180,35,24,.08);
      color: var(--danger);
      font-weight:800;
    }
    .btn.ok{
      border-color: rgba(6,118,71,.30);
      background: rgba(6,118,71,.08);
      color: var(--ok);
      font-weight:800;
    }

    /* Sections */
    .card{
      background: var(--card);
      border:1px solid var(--stroke);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    section{scroll-margin-top: 96px}
    .section{padding:22px; margin-top:16px}

    /* Hero */
    .hero{
      margin-top: 18px;
      padding: 22px;
      position:relative;
      overflow:hidden;
    }
    .hero:before{
      content:"";
      position:absolute; inset:-2px;
      background:
        radial-gradient(680px 240px at 16% 8%, rgba(247,194,42,.22), transparent 60%),
        radial-gradient(680px 260px at 92% 42%, rgba(3,77,114,.14), transparent 60%);
      pointer-events:none;
    }
    .heroGrid{
      position:relative;
      display:grid;
      grid-template-columns: 1.05fr .95fr;
      gap: 18px;
      align-items: center;
    }
    h1{
      margin:0 0 10px;
      font-size: clamp(28px, 3.1vw, 44px);
      letter-spacing:-0.02em;
      max-width: 22ch;
    }
    .lead{
      margin:0 0 18px;
      color: var(--muted);
      font-size: 16px;
      max-width: 66ch;
    }
    .heroRow{
      display:flex; gap:10px; flex-wrap:wrap; align-items:center;
      margin-top: 10px;
    }
    .tiny{font-size:12.8px; color: rgba(20,32,51,.60); margin-top:10px}

    .heroImage{
      border-radius: var(--radius);
      overflow:hidden;
      border:1px solid var(--stroke);
      background:#fff;
      box-shadow: 0 18px 40px rgba(1,18,63,.10);
      position:relative;
      min-height: 290px;
    }
    .heroImage img{width:100%; height:100%; display:block; object-fit: cover;}
    .heroTag{
      position:absolute;
      left:14px; bottom:14px;
      padding:10px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.85);
      border:1px solid rgba(1,18,63,.10);
      color: rgba(20,32,51,.85);
      font-size: 12.8px;
      backdrop-filter: blur(8px);
    }

    /* Parents section tiles */
    .grid3{
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap:12px;
      margin-top: 12px;
    }
    .tile{
      border:1px solid var(--stroke);
      background: rgba(255,255,255,.72);
      border-radius: var(--radius2);
      padding: 16px;
      min-height: 128px;
    }
    .tile h3{margin:0 0 8px; font-size: 15.5px}
    .tile p{margin:0; color: var(--muted); font-size: 13.5px}

    .icon{
      width:36px; height:36px;
      border-radius: 14px;
      display:inline-flex; align-items:center; justify-content:center;
      background: rgba(247,194,42,.18);
      border:1px solid rgba(247,194,42,.40);
      margin-bottom: 10px;
      font-size: 18px;
    }

    /* Directory */
    .dirTop{
      display:flex; justify-content:space-between; align-items:flex-end;
      gap: 12px; flex-wrap:wrap;
      margin-bottom: 10px;
    }
    .dirTop h2{margin:0 0 4px; letter-spacing:-.01em}
    .dirTop p{margin:0; color:var(--muted); font-size: 13.5px}
    .filters{
      display:grid;
      grid-template-columns: 1.3fr 1fr 1fr 1fr;
      gap: 10px;
      margin-top: 12px;
    }
    .field label{display:block; font-size:12.5px; color:var(--muted); margin-bottom:6px}
    .field input, .field select, .field textarea{
      width:100%;
      border-radius: 12px;
      border:1px solid var(--stroke);
      background: rgba(255,255,255,.92);
      padding: 11px 12px;
      outline:none;
      font-size: 14px;
      color: var(--text);
    }
    .field textarea{min-height:96px; resize:vertical}
    .field input:focus, .field select:focus, .field textarea:focus{
      box-shadow: 0 0 0 4px var(--focus);
      border-color: rgba(3,77,114,.30);
    }

    .dirMeta{
      display:flex; gap:10px; align-items:center; flex-wrap:wrap;
      margin-top: 10px;
      color: var(--muted);
      font-size: 13.2px;
    }
    .pill{
      display:inline-flex; align-items:center; gap:8px;
      padding:8px 10px;
      border-radius: 999px;
      border:1px solid var(--stroke);
      background: rgba(255,255,255,.72);
      color: var(--muted);
      font-size: 12.8px;
    }
    .pill b{color: var(--text)}
    .pill .dot{
      width:8px; height:8px; border-radius:50%;
      background: var(--accent);
      box-shadow: 0 0 0 4px rgba(247,194,42,.18);
    }

    .results{
      margin-top: 14px;
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .profileCard{
      border:1px solid var(--stroke);
      border-radius: var(--radius2);
      padding: 16px;
      background: rgba(255,255,255,.72);
      display:flex;
      flex-direction:column;
      gap:10px;
      min-height: 190px;
    }
    .row{
      display:flex; gap:10px; align-items:center; justify-content:space-between;
    }
    .name{
      font-weight: 900;
      letter-spacing:-.01em;
      display:flex; gap:8px; align-items:center;
    }
    .badge{
      font-size: 12px;
      padding: 6px 9px;
      border-radius: 999px;
      border:1px solid rgba(3,77,114,.18);
      background: rgba(3,77,114,.06);
      color: rgba(3,77,114,.90);
      font-weight: 700;
      white-space:nowrap;
    }
    .badge.verified{
      border-color: rgba(247,194,42,.55);
      background: rgba(247,194,42,.16);
      color: #6b4a00;
    }
    .meta{color: var(--muted); font-size: 13.5px}
    .tags{display:flex; gap:8px; flex-wrap:wrap}
    .tag{
      font-size: 12.5px;
      padding: 6px 9px;
      border-radius: 999px;
      border:1px solid var(--stroke);
      background: rgba(255,255,255,.80);
      color: rgba(20,32,51,.80);
    }
    .actions{display:flex; gap:10px; flex-wrap:wrap; margin-top:auto}

    /* Modal */
    .modalBackdrop{
      position:fixed; inset:0;
      background: rgba(1,18,63,.35);
      display:none;
      align-items:center;
      justify-content:center;
      padding: 18px;
      z-index: 2000;
    }
    .modalBackdrop.open{display:flex}
    .modal{
      width:min(860px, 100%);
      background:#fff;
      border-radius: 20px;
      border:1px solid rgba(1,18,63,.12);
      box-shadow: 0 22px 70px rgba(1,18,63,.22);
      overflow:hidden;
    }
    .modalHead{
      padding: 16px 18px;
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap: 12px;
      border-bottom: 1px solid rgba(1,18,63,.10);
      background: linear-gradient(180deg, rgba(247,194,42,.16), rgba(255,255,255,.85));
    }
    .modalHead h3{margin:0; letter-spacing:-.01em}
    .modalBody{padding: 16px 18px}
    .modalGrid{
      display:grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 12px;
    }
    .box{
      border:1px solid rgba(1,18,63,.10);
      background: rgba(255,255,255,.85);
      border-radius: 16px;
      padding: 14px;
    }
    .box h4{margin:0 0 8px}
    .kv{margin:0; padding:0; list-style:none; color: rgba(20,32,51,.82); font-size: 13.5px}
    .kv li{margin:6px 0}
    .bio{margin:0; color: rgba(20,32,51,.82); font-size: 13.5px}
    .closeBtn{border:none; background:transparent; font-size:20px; cursor:pointer; line-height:1; padding:6px 8px}
    .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;}

    /* Contact */
    .contactGrid{
      display:grid;
      grid-template-columns: 1.05fr .95fr;
      gap:12px;
      margin-top: 12px;
    }
    .contactCard{
      border:1px solid var(--stroke);
      border-radius: var(--radius2);
      padding: 16px;
      background: rgba(255,255,255,.72);
    }
    .miniList{margin:10px 0 0; padding:0; list-style:none; color: var(--muted); font-size: 13.5px}
    .miniList li{margin:6px 0}

    .form{
      display:grid; gap:10px;
      grid-template-columns: 1fr 1fr;
      margin-top: 10px;
    }
    .form label{font-size:12.5px; color: var(--muted)}
    .form input, .form textarea{
      width:100%;
      border-radius: 12px;
      border:1px solid var(--stroke);
      background: rgba(255,255,255,.92);
      color: var(--text);
      padding: 11px 12px;
      outline:none;
      font-size: 14px;
    }
    .form input:focus, .form textarea:focus{
      box-shadow: 0 0 0 4px var(--focus);
      border-color: rgba(3,77,114,.30);
    }
    .form textarea{grid-column: 1 / -1; min-height: 96px; resize: vertical}
    .form .full{grid-column: 1 / -1}

    /* Admin */
    .adminNote{
      color: rgba(20,32,51,.70);
      font-size: 13.5px;
      margin: 8px 0 0;
    }
    .adminGrid{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 12px;
    }
    .adminRow{
      display:flex; gap:10px; flex-wrap:wrap; align-items:center;
      margin-top: 10px;
    }
    .adminList{
      margin-top: 10px;
      display:grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .adminItem{
      border:1px solid var(--stroke);
      border-radius: var(--radius2);
      padding: 14px;
      background: rgba(255,255,255,.72);
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap: 10px;
    }
    .adminItem .left .t{font-weight:900}
    .adminItem .left .s{color: var(--muted); font-size: 13.5px}
    .adminItem .right{display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end}
    .adminItem .right .btn{padding:9px 12px}

    .toast{
      position:fixed;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      background: rgba(255,255,255,.92);
      border:1px solid var(--stroke);
      box-shadow: var(--shadow);
      border-radius: 999px;
      padding: 10px 14px;
      color: rgba(20,32,51,.85);
      font-size: 13.5px;
      display:none;
      z-index: 3000;
    }
    .toast.show{display:block}

    footer{
      margin: 18px 0 34px;
      color: var(--muted);
      font-size: 12.8px;
      display:flex; flex-wrap:wrap; gap:10px; justify-content:space-between;
      border-top: 1px solid var(--stroke);
      padding-top: 14px;
    }
    .smallLinks{display:flex; gap:12px; flex-wrap:wrap}
    .smallLinks a{color: var(--muted); text-decoration:none}
    .smallLinks a:hover{color: var(--text)}

    @media (max-width: 920px){
      .heroGrid{grid-template-columns: 1fr}
      .heroImage{min-height: 220px}
      .filters{grid-template-columns: 1fr}
      .results{grid-template-columns: 1fr}
      .modalGrid{grid-template-columns: 1fr}
      .contactGrid{grid-template-columns: 1fr}
      .form{grid-template-columns: 1fr}
      .brand img{width: 148px}
      .grid3{grid-template-columns:1fr}
      .adminGrid{grid-template-columns:1fr}
    }
  </style>
</head>

<body>
  <header class="topbar">
    <div class="nav">
      <a class="brand" href="#top" aria-label="KinderStars Home">
        <img src="kinderstars-logo.png" alt="KinderStars logo" />
      </a>
      <nav class="navlinks" aria-label="Primary">
        <a href="#parents">Parents</a>
        <a href="#directory">Find a childminder</a>
        <a href="#contact" class="btn primary">Enquire</a>
      </nav>
    </div>
  </header>

  <main id="top" class="wrap">
    <!-- HERO -->
    <section class="card hero">
      <div class="heroGrid">
        <div>
          <h1>Trusted childcare, made simple.</h1>
          <p class="lead">
            KinderStars is a <b>Childminder Agency</b> helping parents find trusted childcare and supporting childminders
            with onboarding, safeguarding, and quality.
          </p>
          <div class="heroRow">
            <a class="btn primary" href="#directory">Search childminders</a>
            <a class="btn ghost" href="#parents">For parents</a>
          </div>
          <p class="tiny">
            Privacy-first: profiles show <b>postcode district</b> (e.g., LU1), not full addresses. Enquiries go through KinderStars.
            <span class="mono" style="opacity:.6">Admin: add “#admin” to the URL.</span>
          </p>
        </div>

        <div class="heroImage" aria-label="KinderStars childcare environment">
          <img src="images.jpg" alt="Parent and children doing activities together at home" />
          <div class="heroTag">KinderStars • Childminder Agency</div>
        </div>
      </div>
    </section>

    <!-- PARENTS -->
    <section id="parents" class="card section">
      <h2 style="margin:0 0 6px; letter-spacing:-.01em">For Parents</h2>
      <p style="margin:0; color:var(--muted)">
        Tell us your child’s age, days/hours needed, and postcode — we’ll guide the next steps.
      </p>

      <div class="grid3" aria-label="Parents highlights">
        <div class="tile">
          <div class="icon" aria-hidden="true">📍</div>
          <h3>Local childcare</h3>
          <p>Support finding a suitable childminder for your needs.</p>
        </div>
        <div class="tile">
          <div class="icon" aria-hidden="true">🤝</div>
          <h3>Clear expectations</h3>
          <p>Simple communication and straightforward standards.</p>
        </div>
        <div class="tile">
          <div class="icon" aria-hidden="true">💬</div>
          <h3>Support when needed</h3>
          <p>A clear route for questions or concerns.</p>
        </div>
      </div>

      <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
        <a class="btn primary" href="#directory">Search childminders</a>
        <a class="btn ghost" href="#contact">Ask KinderStars to help</a>
      </div>
    </section>

    <!-- DIRECTORY -->
    <section id="directory" class="card section">
      <div class="dirTop">
        <div>
          <h2>Find a childminder</h2>
          <p>Search by town or postcode district (e.g., LU1, NW10). Filter by days, ages, and verified status.</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn ghost" id="resetBtn" type="button">Reset</button>
          <a class="btn primary" href="#contact">Can’t find a match?</a>
        </div>
      </div>

      <div class="filters" aria-label="Directory filters">
        <div class="field">
          <label for="q">Search</label>
          <input id="q" placeholder="e.g., Luton, LU1, Sarah" />
        </div>

        <div class="field">
          <label for="age">Age group</label>
          <select id="age">
            <option value="">Any</option>
            <option value="0-1">0–1</option>
            <option value="2-4">2–4</option>
            <option value="5-8">5–8</option>
          </select>
        </div>

        <div class="field">
          <label for="day">Day</label>
          <select id="day">
            <option value="">Any</option>
            <option value="Mon">Mon</option>
            <option value="Tue">Tue</option>
            <option value="Wed">Wed</option>
            <option value="Thu">Thu</option>
            <option value="Fri">Fri</option>
            <option value="Sat">Sat</option>
            <option value="Sun">Sun</option>
          </select>
        </div>

        <div class="field">
          <label for="verified">Verified</label>
          <select id="verified">
            <option value="">Any</option>
            <option value="true">Verified only</option>
            <option value="false">Not verified</option>
          </select>
        </div>
      </div>

      <div class="dirMeta">
        <span class="pill"><span class="dot"></span> Showing <b id="countShown">0</b> of <b id="countTotal">0</b></span>
        <span class="pill">Tip: try <b>LU1</b> or <b>Luton</b></span>
      </div>

      <div id="results" class="results" aria-label="Childminder results"></div>
    </section>

    <!-- ADMIN (localStorage) -->
    <section id="admin" class="card section" style="display:none">
      <div class="dirTop">
        <div>
          <h2>Admin: Childminder directory</h2>
          <p>Use this page to add/edit/remove profiles without editing the code.</p>
          <p class="adminNote">
            Note: this admin is <b>browser-only</b> using <span class="mono">localStorage</span>. It’s convenient for an MVP, but not secure like a real login.
            For a real database + secure admin, we’d move to Supabase/Airtable.
          </p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn ghost" id="adminLogoutBtn" type="button">Log out</button>
          <a class="btn ghost" href="#directory">Back to directory</a>
        </div>
      </div>

      <!-- Login panel -->
      <div id="adminLoginCard" class="contactCard" style="margin-top:12px; display:none">
        <b>Admin login</b>
        <p class="adminNote">Enter the admin passcode to manage the directory in this browser.</p>
        <div class="filters" style="grid-template-columns: 1fr auto; align-items:end">
          <div class="field">
            <label for="adminPass">Passcode</label>
            <input id="adminPass" type="password" placeholder="Enter passcode" />
          </div>
          <button class="btn primary" id="adminLoginBtn" type="button">Login</button>
        </div>
        <p class="adminNote" style="margin-top:10px">
          Change the passcode in the code: <span class="mono">ADMIN_PASSCODE</span>.
        </p>
      </div>

      <!-- Main admin -->
      <div id="adminMain" style="display:none; margin-top:12px">
        <div class="adminGrid">
          <div class="contactCard">
            <b id="adminFormTitle">Add new childminder</b>
            <div class="adminNote">Privacy tip: use postcode district only (e.g., LU1) and first name + last initial.</div>

            <div class="filters" style="grid-template-columns: 1fr 1fr; margin-top:12px">
              <div class="field">
                <label for="f_id">Reference ID</label>
                <input id="f_id" placeholder="e.g., KS-LU1-005" />
              </div>
              <div class="field">
                <label for="f_verified">Verified</label>
                <select id="f_verified">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div class="field">
                <label for="f_firstName">First name</label>
                <input id="f_firstName" placeholder="e.g., Sarah" />
              </div>
              <div class="field">
                <label for="f_lastInitial">Last initial</label>
                <input id="f_lastInitial" placeholder="e.g., M" maxlength="2" />
              </div>

              <div class="field">
                <label for="f_town">Town/City</label>
                <input id="f_town" placeholder="e.g., Luton" />
              </div>
              <div class="field">
                <label for="f_postcodeDistrict">Postcode district</label>
                <input id="f_postcodeDistrict" placeholder="e.g., LU1" />
              </div>

              <div class="field">
                <label for="f_ofstedStatus">Ofsted status</label>
                <select id="f_ofstedStatus">
                  <option value="Registered">Registered</option>
                  <option value="In progress">In progress</option>
                  <option value="Status on request">Status on request</option>
                </select>
              </div>
              <div class="field">
                <label for="f_experienceYears">Experience (years)</label>
                <input id="f_experienceYears" type="number" min="0" max="60" placeholder="e.g., 6" />
              </div>

              <div class="field">
                <label for="f_hours">Hours</label>
                <input id="f_hours" placeholder="e.g., 08:00–18:00" />
              </div>
              <div class="field">
                <label for="f_languages">Languages (comma separated)</label>
                <input id="f_languages" placeholder="e.g., English, Urdu" />
              </div>

              <div class="field">
                <label for="f_ageGroups">Age groups</label>
                <select id="f_ageGroups" multiple size="3" style="height:auto">
                  <option value="0-1">0–1</option>
                  <option value="2-4">2–4</option>
                  <option value="5-8">5–8</option>
                </select>
                <div class="adminNote">Hold Ctrl/⌘ to select multiple.</div>
              </div>

              <div class="field">
                <label for="f_days">Days available</label>
                <select id="f_days" multiple size="7" style="height:auto">
                  <option value="Mon">Mon</option>
                  <option value="Tue">Tue</option>
                  <option value="Wed">Wed</option>
                  <option value="Thu">Thu</option>
                  <option value="Fri">Fri</option>
                  <option value="Sat">Sat</option>
                  <option value="Sun">Sun</option>
                </select>
                <div class="adminNote">Hold Ctrl/⌘ to select multiple.</div>
              </div>

              <div class="field" style="grid-column:1/-1">
                <label for="f_bio">Short bio</label>
                <textarea id="f_bio" placeholder="Warm, play-based childcare with daily learning activities..."></textarea>
              </div>
            </div>

            <div class="adminRow">
              <button class="btn ok" id="saveBtn" type="button">Save</button>
              <button class="btn ghost" id="clearBtn" type="button">Clear form</button>
              <button class="btn danger" id="deleteBtn" type="button" style="display:none">Delete</button>
              <span class="adminNote" id="formHint"></span>
            </div>
          </div>

          <div class="contactCard">
            <b>Manage & backup</b>
            <div class="adminRow">
              <button class="btn ghost" id="seedBtn" type="button">Reset to sample data</button>
              <button class="btn ghost" id="exportBtn" type="button">Export JSON</button>
              <button class="btn ghost" id="copyExportBtn" type="button">Copy JSON</button>
            </div>

            <div class="field" style="margin-top:10px">
              <label for="importArea">Import JSON (replace current data)</label>
              <textarea id="importArea" placeholder='Paste exported JSON here, then click “Import JSON”.'></textarea>
            </div>
            <div class="adminRow">
              <button class="btn primary" id="importBtn" type="button">Import JSON</button>
              <button class="btn ghost" id="downloadBtn" type="button">Download JSON</button>
            </div>

            <div class="adminNote">
              Use Export/Import to move your directory between devices. (localStorage is per-device/per-browser.)
            </div>

            <hr style="border:none; border-top:1px solid var(--stroke); margin:14px 0" />

            <b>Current profiles</b>
            <div class="adminNote">Click “Edit” to load into the form.</div>
            <div id="adminList" class="adminList"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTACT -->
    <section id="contact" class="card section">
      <h2 style="margin:0 0 6px; letter-spacing:-.01em">Contact</h2>
      <p style="margin:0; color:var(--muted)">We usually respond by email. For urgent queries, call us.</p>

      <div class="contactGrid">
        <div class="contactCard">
          <b>KinderStars Ltd</b>
          <ul class="miniList">
            <li><b>Email:</b> <a href="mailto:info@kinderstars.co.uk">info@kinderstars.co.uk</a></li>
            <li><b>Phone:</b> <a href="tel:0208451234">020 8451 234</a></li>
            <li><b>Address:</b> Lux, Victory House, Luton, LU1 3BS</li>
          </ul>
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
            <a class="btn primary" href="mailto:info@kinderstars.co.uk?subject=Enquiry%20-%20KinderStars">Email us</a>
            <a class="btn" href="tel:0208451234">Call</a>
          </div>
        </div>

        <div class="contactCard">
          <b>Quick message</b>
          <p style="margin:8px 0 0; color:var(--muted); font-size:13.5px">
            Replace the form <b>action</b> with your Formspree/Netlify endpoint to receive submissions.
          </p>

          <form class="form" method="post" action="#" onsubmit="return handleFakeSubmit(event)">
            <div>
              <label for="name">Name</label>
              <input id="name" name="name" autocomplete="name" required />
            </div>
            <div>
              <label for="email">Email</label>
              <input id="email" name="email" type="email" autocomplete="email" required />
            </div>
            <div class="full">
              <label for="message">Message</label>
              <textarea id="message" name="message" required placeholder="Tell us what you need + your postcode district"></textarea>
            </div>
            <div class="full" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center">
              <button class="btn primary" type="submit">Send</button>
              <span id="formStatus" style="color:var(--muted); font-size:12.8px"></span>
            </div>
          </form>
        </div>
      </div>
    </section>

    <footer>
      <div>© <span id="year"></span> KinderStars Ltd • Childminder Agency</div>
      <div class="smallLinks">
        <a href="#parents">Parents</a>
        <a href="#directory">Directory</a>
        <a href="#contact">Contact</a>
      </div>
    </footer>
  </main>

  <!-- PROFILE MODAL -->
  <div id="modalBackdrop" class="modalBackdrop" role="dialog" aria-modal="true" aria-label="Childminder profile">
    <div class="modal">
      <div class="modalHead">
        <div>
          <h3 id="mTitle">Profile</h3>
          <div class="meta" id="mSub"></div>
        </div>
        <button class="closeBtn" id="closeModal" aria-label="Close">✕</button>
      </div>
      <div class="modalBody">
        <div class="modalGrid">
          <div class="box">
            <h4>About</h4>
            <p class="bio" id="mBio"></p>
            <p class="tiny" id="mPrivacy"></p>
          </div>
          <div class="box">
            <h4>Details</h4>
            <ul class="kv" id="mDetails"></ul>
            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
              <a class="btn primary" id="mEnquire" href="#">Send enquiry</a>
              <button class="btn ghost" id="mCopyRef" type="button">Copy reference</button>
            </div>
            <div class="tiny">Enquiries go to KinderStars and are routed to the childminder.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast" role="status" aria-live="polite"></div>

  <script>
    /******************************************************************
     * QUICK SETUP
     * 1) Put files next to index.html:
     *    - kinderstars-logo.png
     *    - images.jpg
     *
     * 2) Admin page:
     *    - open: yoursite.com/#admin
     *
     * 3) Change passcode (IMPORTANT):
     *    - set ADMIN_PASSCODE below.
     *
     * NOTE: This admin uses localStorage (browser-only). Convenient MVP.
     * For secure multi-user admin + real database, move to Supabase/Airtable.
     ******************************************************************/
    const ADMIN_PASSCODE = "KS-ADMIN-2026"; // <-- CHANGE THIS

    const STORAGE_KEY = "kinderstars_childminders_v1";
    const ADMIN_SESSION_KEY = "kinderstars_admin_logged_in_v1";

    /* Default sample data (seed) */
    const SEED_DATA = [
      {
        id: "KS-LU1-001",
        firstName: "Sarah",
        lastInitial: "M",
        town: "Luton",
        postcodeDistrict: "LU1",
        verified: true,
        ageGroups: ["0-1","2-4"],
        days: ["Mon","Tue","Wed","Thu","Fri"],
        hours: "08:00–18:00",
        languages: ["English","Urdu"],
        experienceYears: 6,
        ofstedStatus: "Registered",
        bio: "Warm, play-based childcare with daily learning activities, outdoor time, and a calm routine."
      },
      {
        id: "KS-LU2-002",
        firstName: "Aisha",
        lastInitial: "K",
        town: "Luton",
        postcodeDistrict: "LU2",
        verified: false,
        ageGroups: ["2-4","5-8"],
        days: ["Mon","Wed","Thu","Fri"],
        hours: "07:30–17:30",
        languages: ["English","Punjabi"],
        experienceYears: 4,
        ofstedStatus: "In progress",
        bio: "Friendly home-from-home care. Focus on confidence, communication, and creative play."
      },
      {
        id: "KS-MK9-003",
        firstName: "Rachel",
        lastInitial: "T",
        town: "Milton Keynes",
        postcodeDistrict: "MK9",
        verified: true,
        ageGroups: ["0-1","2-4","5-8"],
        days: ["Tue","Wed","Thu"],
        hours: "09:00–16:30",
        languages: ["English"],
        experienceYears: 9,
        ofstedStatus: "Registered",
        bio: "Experienced childminder offering structured routines, story time, sensory play, and school pickups (district based)."
      },
      {
        id: "KS-NW10-004",
        firstName: "Hina",
        lastInitial: "A",
        town: "London",
        postcodeDistrict: "NW10",
        verified: true,
        ageGroups: ["2-4","5-8"],
        days: ["Mon","Tue","Wed","Thu"],
        hours: "08:00–17:00",
        languages: ["English","Arabic"],
        experienceYears: 7,
        ofstedStatus: "Registered",
        bio: "Positive, nurturing setting with learning through play, healthy snacks, and gentle behavioural guidance."
      }
    ];

    /* DOM */
    const els = {
      q: document.getElementById("q"),
      age: document.getElementById("age"),
      day: document.getElementById("day"),
      verified: document.getElementById("verified"),
      results: document.getElementById("results"),
      countShown: document.getElementById("countShown"),
      countTotal: document.getElementById("countTotal"),
      resetBtn: document.getElementById("resetBtn"),
      year: document.getElementById("year"),

      modalBackdrop: document.getElementById("modalBackdrop"),
      closeModal: document.getElementById("closeModal"),
      mTitle: document.getElementById("mTitle"),
      mSub: document.getElementById("mSub"),
      mBio: document.getElementById("mBio"),
      mDetails: document.getElementById("mDetails"),
      mEnquire: document.getElementById("mEnquire"),
      mCopyRef: document.getElementById("mCopyRef"),
      mPrivacy: document.getElementById("mPrivacy"),

      adminSection: document.getElementById("admin"),
      adminLoginCard: document.getElementById("adminLoginCard"),
      adminMain: document.getElementById("adminMain"),
      adminPass: document.getElementById("adminPass"),
      adminLoginBtn: document.getElementById("adminLoginBtn"),
      adminLogoutBtn: document.getElementById("adminLogoutBtn"),
      adminList: document.getElementById("adminList"),

      adminFormTitle: document.getElementById("adminFormTitle"),
      formHint: document.getElementById("formHint"),
      f_id: document.getElementById("f_id"),
      f_verified: document.getElementById("f_verified"),
      f_firstName: document.getElementById("f_firstName"),
      f_lastInitial: document.getElementById("f_lastInitial"),
      f_town: document.getElementById("f_town"),
      f_postcodeDistrict: document.getElementById("f_postcodeDistrict"),
      f_ofstedStatus: document.getElementById("f_ofstedStatus"),
      f_experienceYears: document.getElementById("f_experienceYears"),
      f_hours: document.getElementById("f_hours"),
      f_languages: document.getElementById("f_languages"),
      f_ageGroups: document.getElementById("f_ageGroups"),
      f_days: document.getElementById("f_days"),
      f_bio: document.getElementById("f_bio"),

      saveBtn: document.getElementById("saveBtn"),
      clearBtn: document.getElementById("clearBtn"),
      deleteBtn: document.getElementById("deleteBtn"),

      seedBtn: document.getElementById("seedBtn"),
      exportBtn: document.getElementById("exportBtn"),
      copyExportBtn: document.getElementById("copyExportBtn"),
      importArea: document.getElementById("importArea"),
      importBtn: document.getElementById("importBtn"),
      downloadBtn: document.getElementById("downloadBtn"),

      toast: document.getElementById("toast"),
    };

    els.year.textContent = new Date().getFullYear();

    /* Helpers */
    function toast(msg){
      els.toast.textContent = msg;
      els.toast.classList.add("show");
      clearTimeout(toast._t);
      toast._t = setTimeout(()=> els.toast.classList.remove("show"), 1600);
    }
    function normalise(s){ return (s||"").toString().trim().toLowerCase(); }
    function escapeHtml(str){
      return (str || "").replace(/[&<>"']/g, m => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
      }[m]));
    }
    function selectedValues(selectEl){
      return Array.from(selectEl.selectedOptions).map(o => o.value);
    }
    function setSelectedValues(selectEl, values){
      const set = new Set(values || []);
      Array.from(selectEl.options).forEach(o => { o.selected = set.has(o.value); });
    }
    function uniqById(list){
      const map = new Map();
      for(const item of list){
        if(item && item.id) map.set(item.id, item);
      }
      return Array.from(map.values());
    }

    /* Storage-backed database */
    function loadDB(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw){
          localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
          return structuredClone(SEED_DATA);
        }
        const parsed = JSON.parse(raw);
        if(!Array.isArray(parsed)) throw new Error("Invalid DB format");
        return parsed;
      }catch(e){
        console.warn("DB load failed, reseeding:", e);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
        return structuredClone(SEED_DATA);
      }
    }
    function saveDB(data){
      const cleaned = Array.isArray(data) ? data : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }

    let DB = loadDB();

    /* Directory filtering */
    function matchesQuery(cm, q){
      if(!q) return true;
      const hay = [
        cm.firstName, cm.lastInitial, cm.town, cm.postcodeDistrict, cm.id,
        (cm.languages||[]).join(" ")
      ].join(" ");
      return normalise(hay).includes(normalise(q));
    }
    function matchesAge(cm, age){ return !age || (cm.ageGroups||[]).includes(age); }
    function matchesDay(cm, day){ return !day || (cm.days||[]).includes(day); }
    function matchesVerified(cm, v){
      if(v==="") return true;
      const want = v==="true";
      return !!cm.verified === want;
    }
    function filterData(){
      return DB.filter(cm =>
        matchesQuery(cm, els.q.value) &&
        matchesAge(cm, els.age.value) &&
        matchesDay(cm, els.day.value) &&
        matchesVerified(cm, els.verified.value)
      );
    }

    function makeEnquiryMailto(cm){
      const subject = encodeURIComponent(`Childcare Enquiry – ${cm.id} (${cm.postcodeDistrict})`);
      const body = encodeURIComponent(
`Hello KinderStars,

I would like to enquire about: ${cm.firstName} ${cm.lastInitial}. (Ref: ${cm.id})

My postcode (district is fine):
Child age(s):
Days/hours needed:
Start date:
Any extra notes:

Thank you,`
      );
      return `mailto:info@kinderstars.co.uk?subject=${subject}&body=${body}`;
    }

    function renderDirectory(){
      els.countTotal.textContent = String(DB.length);
      const data = filterData();
      els.countShown.textContent = String(data.length);
      els.results.innerHTML = "";

      if(data.length === 0){
        els.results.innerHTML = `
          <div class="profileCard" style="grid-column:1/-1">
            <div class="name">No matches found</div>
            <div class="meta">Try a broader search (e.g., <b>LU1</b> or <b>Luton</b>) or clear filters.</div>
            <div class="actions">
              <button class="btn ghost" type="button" onclick="document.getElementById('resetBtn').click()">Reset filters</button>
              <a class="btn primary" href="#contact">Ask KinderStars to help</a>
            </div>
          </div>
        `;
        return;
      }

      for(const cm of data){
        const displayName = `${cm.firstName} ${cm.lastInitial}.`;
        const badge = cm.verified ? `<span class="badge verified">Verified</span>` : `<span class="badge">Listed</span>`;
        const tags = [
          cm.postcodeDistrict,
          cm.town,
          cm.hours,
          ...(cm.ageGroups||[]).map(a => `Ages ${a}`)
        ].slice(0,5);

        const card = document.createElement("div");
        card.className = "profileCard";
        card.innerHTML = `
          <div class="row">
            <div class="name">${escapeHtml(displayName)} ${badge}</div>
          </div>
          <div class="meta">
            <b>${escapeHtml(cm.postcodeDistrict)}</b> • ${escapeHtml(cm.town)} • ${escapeHtml(cm.ofstedStatus || "Status on request")}
          </div>
          <div class="tags">
            ${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
          </div>
          <div class="actions">
            <button class="btn ghost" type="button" data-view="${escapeHtml(cm.id)}">View profile</button>
            <a class="btn primary" href="${makeEnquiryMailto(cm)}">Enquire</a>
          </div>
          <div class="tiny">Ref: <b class="mono">${escapeHtml(cm.id)}</b></div>
        `;

        card.querySelector("[data-view]").addEventListener("click", () => openModal(cm.id));
        els.results.appendChild(card);
      }
    }

    /* Profile modal */
    function openModal(id){
      const cm = DB.find(x => x.id === id);
      if(!cm) return;

      const displayName = `${cm.firstName} ${cm.lastInitial}.`;
      els.mTitle.textContent = `${displayName}${cm.verified ? " • Verified" : ""}`;
      els.mSub.textContent = `${cm.postcodeDistrict} • ${cm.town} • ${cm.ofstedStatus || "Status on request"}`;
      els.mBio.textContent = cm.bio || "Details available on request.";
      els.mPrivacy.textContent =
        "Privacy note: district-level location only. Full address and direct contact details are shared only through KinderStars.";

      const details = [
        ["Reference", cm.id],
        ["Postcode district", cm.postcodeDistrict],
        ["Town", cm.town],
        ["Ages", (cm.ageGroups||[]).join(", ") || "—"],
        ["Days", (cm.days||[]).join(", ") || "—"],
        ["Hours", cm.hours || "—"],
        ["Languages", (cm.languages||[]).join(", ") || "—"],
        ["Experience", cm.experienceYears ? `${cm.experienceYears} years` : "—"],
        ["Status", cm.ofstedStatus || "—"],
      ];

      els.mDetails.innerHTML = details.map(([k,v]) =>
        `<li><b>${escapeHtml(k)}:</b> ${escapeHtml(String(v ?? ""))}</li>`
      ).join("");

      els.mEnquire.setAttribute("href", makeEnquiryMailto(cm));
      els.mCopyRef.onclick = async () => {
        try{
          await navigator.clipboard.writeText(cm.id);
          els.mCopyRef.textContent = "Copied!";
          setTimeout(()=> els.mCopyRef.textContent="Copy reference", 900);
        }catch(e){
          alert("Copy failed. Reference: " + cm.id);
        }
      };

      els.modalBackdrop.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeModal(){
      els.modalBackdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
    els.closeModal.addEventListener("click", closeModal);
    els.modalBackdrop.addEventListener("click", (e) => { if(e.target === els.modalBackdrop) closeModal(); });
    document.addEventListener("keydown", (e) => { if(e.key === "Escape") closeModal(); });

    /* Filters */
    els.q.addEventListener("input", renderDirectory);
    els.age.addEventListener("change", renderDirectory);
    els.day.addEventListener("change", renderDirectory);
    els.verified.addEventListener("change", renderDirectory);
    els.resetBtn.addEventListener("click", () => {
      els.q.value = "";
      els.age.value = "";
      els.day.value = "";
      els.verified.value = "";
      renderDirectory();
    });

    /* Contact form placeholder */
    function handleFakeSubmit(e){
      const form = e.target;
      const action = (form.getAttribute("action") || "").trim();
      if (!action || action === "#") {
        e.preventDefault();
        document.getElementById("formStatus").textContent =
          "Form not connected yet — please email info@kinderstars.co.uk (replace the form action URL to enable submissions).";
        return false;
      }
      return true;
    }
    window.handleFakeSubmit = handleFakeSubmit;

    /***********************
     * ADMIN (localStorage)
     ***********************/
    function isAdmin(){
      return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
    }
    function setAdminSession(on){
      localStorage.setItem(ADMIN_SESSION_KEY, on ? "1" : "0");
    }

    let editingId = null;

    function showAdminUI(){
      els.adminSection.style.display = "block";
      if(isAdmin()){
        els.adminLoginCard.style.display = "none";
        els.adminMain.style.display = "block";
        renderAdminList();
      }else{
        els.adminMain.style.display = "none";
        els.adminLoginCard.style.display = "block";
      }
    }
    function hideAdminUI(){
      els.adminSection.style.display = "none";
    }

    function resetAdminForm(){
      editingId = null;
      els.adminFormTitle.textContent = "Add new childminder";
      els.formHint.textContent = "";
      els.deleteBtn.style.display = "none";

      els.f_id.value = "";
      els.f_verified.value = "true";
      els.f_firstName.value = "";
      els.f_lastInitial.value = "";
      els.f_town.value = "";
      els.f_postcodeDistrict.value = "";
      els.f_ofstedStatus.value = "Registered";
      els.f_experienceYears.value = "";
      els.f_hours.value = "";
      els.f_languages.value = "";
      setSelectedValues(els.f_ageGroups, []);
      setSelectedValues(els.f_days, []);
      els.f_bio.value = "";
    }

    function loadIntoForm(cm){
      editingId = cm.id;
      els.adminFormTitle.textContent = "Edit childminder";
      els.formHint.textContent = "Editing existing profile. Change fields then click Save.";
      els.deleteBtn.style.display = "inline-flex";

      els.f_id.value = cm.id || "";
      els.f_verified.value = cm.verified ? "true" : "false";
      els.f_firstName.value = cm.firstName || "";
      els.f_lastInitial.value = cm.lastInitial || "";
      els.f_town.value = cm.town || "";
      els.f_postcodeDistrict.value = cm.postcodeDistrict || "";
      els.f_ofstedStatus.value = cm.ofstedStatus || "Registered";
      els.f_experienceYears.value = (cm.experienceYears ?? "") === "" ? "" : String(cm.experienceYears);
      els.f_hours.value = cm.hours || "";
      els.f_languages.value = (cm.languages || []).join(", ");
      setSelectedValues(els.f_ageGroups, cm.ageGroups || []);
      setSelectedValues(els.f_days, cm.days || []);
      els.f_bio.value = cm.bio || "";
    }

    function formToRecord(){
      const id = els.f_id.value.trim();
      const firstName = els.f_firstName.value.trim();
      const lastInitial = els.f_lastInitial.value.trim();
      const town = els.f_town.value.trim();
      const postcodeDistrict = els.f_postcodeDistrict.value.trim().toUpperCase();
      const verified = els.f_verified.value === "true";
      const ofstedStatus = els.f_ofstedStatus.value.trim();
      const experienceYearsRaw = els.f_experienceYears.value.trim();
      const experienceYears = experienceYearsRaw === "" ? null : Number(experienceYearsRaw);
      const hours = els.f_hours.value.trim();
      const languages = els.f_languages.value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      const ageGroups = selectedValues(els.f_ageGroups);
      const days = selectedValues(els.f_days);
      const bio = els.f_bio.value.trim();

      return {
        id, firstName, lastInitial, town, postcodeDistrict,
        verified, ofstedStatus,
        experienceYears: Number.isFinite(experienceYears) ? experienceYears : null,
        hours, languages, ageGroups, days, bio
      };
    }

    function validateRecord(r){
      if(!r.id) return "Reference ID is required (e.g., KS-LU1-005).";
      if(!/^[A-Za-z0-9-]+$/.test(r.id)) return "Reference ID can only contain letters, numbers, and dashes.";
      if(!r.firstName) return "First name is required.";
      if(!r.lastInitial) return "Last initial is required.";
      if(!r.postcodeDistrict) return "Postcode district is required (e.g., LU1).";
      if(!r.town) return "Town/City is required.";
      if((r.ageGroups||[]).length === 0) return "Select at least one age group.";
      if((r.days||[]).length === 0) return "Select at least one day.";
      return null;
    }

    function upsertRecord(record){
      const idx = DB.findIndex(x => x.id === record.id);
      if(idx >= 0){
        DB[idx] = record;
      }else{
        DB = [record, ...DB];
      }
      DB = uniqById(DB);
      saveDB(DB);
    }

    function deleteRecord(id){
      DB = DB.filter(x => x.id !== id);
      saveDB(DB);
    }

    function renderAdminList(){
      els.adminList.innerHTML = "";
      if(DB.length === 0){
        els.adminList.innerHTML = `<div class="adminNote">No profiles yet.</div>`;
        return;
      }
      const sorted = [...DB].sort((a,b) => (a.postcodeDistrict||"").localeCompare(b.postcodeDistrict||""));
      for(const cm of sorted){
        const displayName = `${cm.firstName || ""} ${cm.lastInitial || ""}.`.trim();
        const status = cm.verified ? "Verified" : "Listed";
        const div = document.createElement("div");
        div.className = "adminItem";
        div.innerHTML = `
          <div class="left">
            <div class="t">${escapeHtml(displayName)} <span class="mono" style="opacity:.7">(${escapeHtml(cm.id)})</span></div>
            <div class="s">${escapeHtml(cm.postcodeDistrict || "")} • ${escapeHtml(cm.town || "")} • ${escapeHtml(status)} • ${escapeHtml(cm.ofstedStatus || "")}</div>
          </div>
          <div class="right">
            <button class="btn ghost" type="button" data-edit="${escapeHtml(cm.id)}">Edit</button>
            <button class="btn danger" type="button" data-del="${escapeHtml(cm.id)}">D

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2c80c269-5ea9-4d69-b7ea-bb11b18311cf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
