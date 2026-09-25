# ADNAVRA — How to Run the Project Locally (SEO Guide)

This guide is for non-developers. Follow it top-to-bottom, don't skip steps.

You need 2 things before starting:
1. The code from GitHub (you already pulled it)
2. The `.env` file sent to you privately (it contains database passwords — never share it, never commit it)

---

## 1. Install prerequisites (one time only)

1. Install **Node.js 20 LTS** from https://nodejs.org
   - Click the button that says "LTS" (not "Current")
   - Accept all defaults during install
2. Install **Git** from https://git-scm.com/downloads (if you don't have it)
3. Install **VS Code** from https://code.visualstudio.com (optional but recommended)

Check it worked — open a terminal and run:

```bash
node -v
npm -v
```

You should see something like `v20.x.x` and `10.x.x`. If you see "not recognized", restart your computer after installing Node.

---

## 2. Get the code (you already did this, for reference)

```bash
git clone <your-github-repo-url>
cd SaaS
```

To get the latest changes later:

```bash
git pull
```

---

## 3. Add the `.env` file (important)

1. Take the `.env` file you received privately
2. Copy it into the project root folder — the same folder that contains `package.json`
3. The folder should now look like this:

```
SaaS/
├── package.json
├── .env              <-- you just added this
├── .env.example      <-- this was already there, don't touch it
├── src/
├── prisma/
└── ...
```

Rules:
- Do NOT rename it (must be exactly `.env`, not `.env.txt`)
- Do NOT commit it to GitHub — it is already gitignored, just leave it alone
- Do NOT edit values inside unless asked — if the site fails to start, ask a dev first

---

## 4. Install dependencies (one time only, ~2-5 min)

In the project folder, run:

```bash
npm install
```

What this does: downloads all libraries the site needs into `node_modules/`.

If you ever get strange errors after a `git pull`, run it again — the dependencies may have changed.

---

## 5. Connect to the database (one time only, ~30 sec)

The database is hosted (Neon / Supabase) — you do NOT need to install Postgres locally. The `.env` file already points to it.

Just generate the database client:

```bash
npx prisma generate
```

> Do NOT run `prisma migrate` commands unless a developer explicitly asks you to. You could break the shared database.

---

## 6. Run the site

```bash
npm run dev
```

Wait until you see:

```
✓ Ready in ... 
○ Local: http://localhost:3000
```

Then open in your browser:

**http://localhost:3000**

To stop the site: press `Ctrl + C` in the terminal.

---

## 7. What to check as SEO

Public pages (no login needed — these are your focus):

| Page | URL | Source folder |
|------|-----|---------------|
| Landing page | http://localhost:3000/ | `src/app/(marketing)/` |
| Salon public page | http://localhost:3000/[salon-name] e.g. `/glow-salon` | `src/app/[businessSlug]/` |
| Booking page | http://localhost:3000/[salon-name]/book | `src/app/[businessSlug]/book/` |

Locked pages (require login — you can ignore these unless asked):
- http://localhost:3000/dashboard — owner portal
- http://localhost:3000/admin — platform admin
- http://localhost:3000/login, `/signup`, `/reset-password`

SEO-relevant files to know about:
- Metadata lives in each `page.tsx` (`export const metadata = {...}`)
- Global title/description template is in `src/app/layout.tsx`
- `next.config.js` contains security headers (CSP, X-Frame-Options) — don't change without a dev

---

## 8. Everyday workflow

```bash
# 1. Get latest code
git pull

# 2. (Only if package.json changed) update libraries
npm install

# 3. Start the site
npm run dev
```

---

## 9. Troubleshooting

**"Invalid environment variables / DATABASE_URL is required"**
- Your `.env` file is missing or in the wrong folder. It must sit next to `package.json`. Re-copy it.

**"Port 3000 is already in use"**
- You already have the site running in another terminal. Either use the old one, or run:
```bash
npx next dev -p 3001
```
Then open http://localhost:3001

**Blank white page / CSP errors in console**
- Stop (`Ctrl+C`) and run `npm run dev` again. The security headers in `next.config.js` need a fresh restart after dependency changes.

**`npm install` fails**
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- On Windows, run the terminal as Administrator if you see permission errors
- Make sure Node is v20+: `node -v`

**Site loads but data is missing**
- That's normal — you're looking at the shared dev database. Ask a dev for a test salon slug (e.g. `/glow-salon`) or test login.

**"Prisma Client not generated"**
- Run `npx prisma generate` again, then `npm run dev`.

Still stuck? Send the dev:
1. A screenshot of the terminal error
2. Your Node version (`node -v`)
3. Whether you recently ran `git pull`

---

## 10. Safety checklist for SEO

- [ ] Never share the `.env` file (no email forwards, no screenshots of its contents)
- [ ] Never run `prisma migrate`, `prisma db push`, or `scripts/backup-db.sh`
- [ ] Never commit `.env` — if `git status` shows it, stop and ask a dev
- [ ] Only edit text/metadata files you were asked to change — ask before adding npm packages (per AGENTS.md)
