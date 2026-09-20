// GET  /api/admin/shipments  — list all shipments (auth required)
// POST /api/admin/shipments  — create a shipment, returns a fresh tracking number (auth required)

import { isAuthorized, json, unauthorized } from './_lib/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!isAuthorized(request, env)) return unauthorized();

  const { results } = await env.DB
    .prepare('SELECT * FROM shipments ORDER BY created_at DESC')
    .all();

  return json({ shipments: results });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAuthorized(request, env)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'invalid_body' }, 400);
  }

  const company = (body.company || 'New client').toString().slice(0, 200);
  const origin = (body.origin || 'Origin TBD').toString().slice(0, 200);
  const destination = (body.destination || 'Destination TBD').toString().slice(0, 200);
  const type = (body.type || 'General freight').toString().slice(0, 100);

  // Atomically bump the shared counter to mint the next tracking number.
  const counter = await env.DB
    .prepare("UPDATE counters SET value = value + 1 WHERE name = 'tracking_number' RETURNING value")
    .first();

  if (!counter) {
    return json({ error: 'counter_missing' }, 500);
  }

  const id = 'JBR-' + counter.value;
  const now = new Date().toISOString();

  await env.DB
    .prepare(
      'INSERT INTO shipments (id, company, origin, destination, type, stage, pickup_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)'
    )
    .bind(id, company, origin, destination, type, now, now)
    .run();

  return json({ id, company, origin, destination, type, stage: 0, pickup_at: now });
}
