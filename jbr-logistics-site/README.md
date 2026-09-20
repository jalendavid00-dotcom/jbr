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
