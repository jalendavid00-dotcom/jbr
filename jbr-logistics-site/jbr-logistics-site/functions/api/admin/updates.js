// GET  /api/admin/updates?id=JBR-1001 — list updates for one shipment (auth required)
// POST /api/admin/updates            — body: { id, color, message } (auth required)

import { isAuthorized, json, unauthorized } from './_lib/auth.js';

const VALID_COLORS = ['green', 'yellow', 'red'];

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!isAuthorized(request, env)) return unauthorized();

  const url = new URL(request.url);
  const id = (url.searchParams.get('id') || '').toString().trim().toUpperCase();
  if (!id) return json({ error: 'missing_id' }, 400);

  const { results } = await env.DB
    .prepare('SELECT id, color, message, created_at FROM updates WHERE shipment_id = ? ORDER BY created_at DESC')
    .bind(id)
    .all();

  return json({ updates: results });
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

  const id = (body.id || '').toString().trim().toUpperCase();
  const color = (body.color || '').toString().trim().toLowerCase();
  const message = (body.message || '').toString().trim().slice(0, 500);

  if (!id) return json({ error: 'missing_id' }, 400);
  if (!VALID_COLORS.includes(color)) return json({ error: 'invalid_color' }, 400);
  if (!message) return json({ error: 'missing_message' }, 400);

  const shipment = await env.DB.prepare('SELECT id FROM shipments WHERE id = ?').bind(id).first();
  if (!shipment) return json({ error: 'not_found' }, 404);

  const now = new Date().toISOString();
  await env.DB
    .prepare('INSERT INTO updates (shipment_id, color, message, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, color, message, now)
    .run();

  return json({ ok: true, id, color, message, created_at: now });
}
