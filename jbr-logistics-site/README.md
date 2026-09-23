# JBR Logistics — site + order tracker

## What's in here
- `index.html`, `assets/` — the main site (same as before, now split into HTML + `assets/site.css` so /track and /admin can share the same look)
- `track/index.html` — public "Track a Shipment" page (`/track`)
- `admin/index.html` — password-gated staff page to create shipments and advance their status (`/admin`)
- `functions/api/` — the Cloudflare Pages Functions that back both pages
- `schema.sql` — the one-time database setup

## One-time setup (do this once)

1. **Create the D1 database** (from the project root, with `wrangler` installed):
   ```
   wrangler d1 create jbr-tracking
   ```
   This prints a `database_id` — you'll need it in step 2.

2. **Bind it to the Pages project.** In the Cloudflare dashboard: your Pages
   project → Settings → Functions → D1 database bindings → add binding
   named `DB`, pointing at `jbr-tracking`.

3. **Load the schema:**
   ```
   wrangler d1 execute jbr-tracking --file=./schema.sql
   ```
   (Already ran this once and just adding the new `updates` table? You can
   re-run the whole file — every statement in it is safe to run more than
   once — or just paste the `CREATE TABLE updates (...)` block on its own
   into the D1 dashboard's Console tab.)

4. **Set the admin password.** In the Cloudflare dashboard: your Pages
   project → Settings → Environment variables → add `ADMIN_PASSWORD`
   (mark it "Encrypt" / secret). This is what unlocks `/admin` — anyone
   with this password can create and update shipments, so treat it like
   any other staff login and don't put it in a text file.

5. **Deploy as usual** — upload/push this whole folder to Cloudflare
   Pages. The `functions/` folder is picked up automatically; no extra
   configuration needed there.

## Using it day to day
- Staff go to `yourdomain.com/admin`, sign in with the password, fill in
  the small form, and get back a tracking number (e.g. `JBR-1004`).
- Give that number to the client. They go to `yourdomain.com/track` and
  enter it to see the status.
- As the shipment moves, staff click "Advance to next stage" on the
  admin page — the customer's tracking page reflects it immediately
  (it's a live database lookup, not cached).
- For anything more specific than the three fixed stages — a customs
  hold, a delay, confirmation everything's fine — staff click "Post
  update" on that shipment, pick a color (green = on schedule, yellow =
  minor delay, red = needs attention), and write a short note. It shows
  up on the customer's tracking page right under the timeline, newest
  first.
- "View log" on a shipment shows every update posted against it, each
  with a small × to delete that one entry. There's deliberately no way
  to edit an update's text in place — to fix a mistake, delete the wrong
  one and post a correct one, so the log never silently changes shape
  after a client's already seen it.
- "Delete" on a shipment removes it and its whole update log — click
  once to arm it, click "Confirm delete?" within a few seconds to
  actually delete. This is permanent; the tracking number stops
  resolving for anyone who still has the link.
- Delivered shipments drop out of the default list automatically so it
  doesn't get cluttered with finished work — tick "Show delivered" to
  see the full history. If the *active* list itself passes 50, a small
  banner suggests cleaning up old ones, but nothing is ever blocked —
  staff can always create a new shipment no matter how many exist.

## Notes / what's intentionally simple
- Auth is a single shared password, not per-user accounts — matches the
  "keep it simple" brief. If JBR later wants individual staff logins or
  activity history, that's a bigger step up and worth a separate
  conversation.
- No email/SMS notifications yet when a shipment advances — customers
  have to check the tracking page themselves. Easy to add later (e.g.
  via Web3Forms or a transactional email service) once this is proven
  out.
- Tracking numbers start at `JBR-1001` and increment by one each time,
  stored in the `counters` table so two staff creating shipments at the
  same moment can't collide.
