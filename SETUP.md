# One-time setup — plain language version

Do this once (~45 min). After this, building the app is just talking to Claude Code.

## Words you'll keep seeing

- **Terminal** — the app where you type commands instead of clicking. On Mac: Terminal.app.
- **Node.js** — the program that lets JavaScript run on a computer (normally JS only runs inside browsers). Your app is written in JavaScript, so your laptop needs Node to preview it. **You already have it** — the `npm` command comes with it.
- **npm** — "Node package manager." Comes with Node. Downloads code libraries other people wrote so you don't write everything from scratch.
- **Git** — tracks every version of your code, like unlimited undo history. Already on your Mac.
- **Repo** (repository) — one project's folder as tracked by Git.
- **GitHub** — website that stores an online copy of your repo. Like Google Drive for code, with full history.
- **Clone** — download a repo from GitHub to your laptop, keeping the link between them.
- **Push** — upload your latest changes from laptop to GitHub.
- **CLI** — "command-line interface": a tool you use by typing in Terminal instead of clicking.
- **Migration** — a file of database instructions ("create these tables"). Kept in the repo so your database structure is versioned like code.
- **Environment variable / .env** — secrets (passwords, keys) stored outside your code so they never end up on GitHub.
- **Anon key vs service key** (Supabase) — two passwords to your database. *Anon* = weak one, safe to put in the app; it can only do what your security rules allow (read live vendors, submit enquiries). *Service* = master key that bypasses all rules; server-side only, never in the app, never shared.
- **localhost:3000** — a preview web address that exists only on your laptop. This is where you check work before making it public.
- **Deploy** — put your code live on the internet.

## Step 1 — Install Claude Code

Why: this is the tool that writes the code. Do NOT use the npm command (it hits a Mac permission error). Use Anthropic's own installer — paste this in Terminal:

```
curl -fsSL https://claude.ai/install.sh | bash
```

(That command means: download Anthropic's install script and run it. It puts Claude Code in your own user folder, so no permission problems, and it keeps itself updated.)

Close Terminal, reopen it, then check: `claude --version` should print a version number. Run `claude` once to log in with your Anthropic account.

## Step 2 — Create three free accounts

Why three? Each holds one of the three pieces of any app (from our earlier discussion):

- **github.com** — holds your *code*. Create a new **private** repository named `catering`. Don't add any files when it asks.
- **supabase.com** — holds your *data*. New project → name `catering` → region **Mumbai** (closest to Hyderabad = faster) → set a database password and save it in your notes.
- **vercel.com** — *runs* your app publicly. Sign up **with your GitHub account** — this lets Vercel watch your repo and auto-deploy later.

## Step 3 — Connect your laptop to GitHub

Why: your laptop is where code gets written; GitHub is where it's backed up and where Vercel picks it up from.

In Terminal:

```
git clone https://github.com/YOUR_USERNAME/catering.git
cd catering
```

(`clone` downloads the empty repo; `cd` means "go into that folder" — commands act on whatever folder you're in.)

Now copy this starter folder's contents (PLAN.md, CLAUDE.md, the supabase folder) into the `catering` folder using Finder. Then back in Terminal:

```
git add .
git commit -m "Phase 0: plan and schema"
git push
```

(add = "include these files", commit = "save a named snapshot", push = "upload to GitHub". This trio is how every change ships, forever.)

## Step 4 — Create the database tables

Why: Supabase gave you an empty database. The file in `supabase/migrations/` contains the instructions to build all our tables (vendors, menus, enquiries...). Claude Code will run it for you.

Inside the `catering` folder, run `claude` and paste:

> Install the Supabase CLI if needed, link this repo to my Supabase project, and apply the migration in supabase/migrations. Ask me for anything you need from my Supabase dashboard.

It will ask for two things — both live in your Supabase dashboard: the **project ref** (the random letters in your dashboard's web address) and the **database password** from Step 2. When done, check Supabase → Table Editor: you should see the tables.

## Step 5 — Build the first version

In the same Claude Code session, paste:

> Read PLAN.md and CLAUDE.md. Scaffold a Next.js + TypeScript app in this repo connected to my Supabase project (I'll paste the Project URL and anon key from Supabase → Settings → API). Then build Phase 1: vendor discovery page and vendor profile page with instant per-plate quotes, per the plan. Seed one test vendor with a priced menu so I can see it working.

Preview it: `npm run dev`, then open http://localhost:3000 in your browser. This preview is private to your laptop.

## Step 6 — Put it on the internet

- On vercel.com: Add New Project → Import your `catering` repo.
- Before clicking Deploy, add two Environment Variables (copy values from Supabase → Settings → API):
  - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key (never the service key)
- Deploy. You get a public address like `catering-sri.vercel.app`. A custom domain can be attached later in Vercel settings for ~₹800/yr.

## The loop from now on

1. Terminal → `cd catering` → `claude`
2. Say what you want in plain English
3. Check localhost:3000
4. Happy? Say "commit and push" → live in about a minute

## Safety rules

- The **service key** never goes in app code or anywhere public. Anon key = app, service key = server secrets only.
- Broke production? Vercel → Deployments → previous one → "Promote to Production" = instant undo.
- Database changes always go through a new migration file (Claude Code writes it), never by hand-editing tables in the dashboard — otherwise your repo and database drift apart.
