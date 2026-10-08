const API = 'https://v5api.tiltify.com';
const CACHE_MS = 8000;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'x-client-id, x-client-secret',
};

const tokens = new Map();
const cache = new Map();

const fail = (status, message) => Object.assign(new Error(message), { status });

async function getToken(id, secret) {
  const hit = tokens.get(id);
  if (hit && Date.now() < hit.exp) return hit.value;

  const r = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
  });
  if (!r.ok) throw fail(r.status < 500 ? 401 : 502, 'Tiltify rejected the credentials');

  const j = await r.json();
  tokens.set(id, { value: j.access_token, exp: Date.now() + (j.expires_in - 120) * 1000 });
  return j.access_token;
}

async function tiltify(path, id, secret) {
  const token = await getToken(id, secret);
  const r = await fetch(API + path, { headers: { authorization: `Bearer ${token}` } });
  if (r.status === 401) tokens.delete(id);
  if (!r.ok) throw fail(r.status === 404 ? 404 : 502, `Tiltify returned ${r.status}`);
  const j = await r.json();
  return j.data ?? j;
}

async function load(id, secret, campaign) {
  const path = `/api/public/campaigns/${encodeURIComponent(campaign)}`;
  const [c, d] = await Promise.all([
    tiltify(path, id, secret),
    tiltify(`${path}/donations?limit=25`, id, secret),
  ]);
  const donations = (Array.isArray(d) ? d : [])
    .map((x) => ({
      id: x.id,
      name: x.donor_name || 'Anonymous',
      amount: parseFloat(x.amount?.value) || 0,
      comment: x.donor_comment || '',
      at: x.completed_at,
    }))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
  return {
    total: parseFloat(c.amount_raised?.value) || 0,
    goal: parseFloat(c.goal?.value) || 0,
    currency: c.amount_raised?.currency || 'USD',
    donations,
  };
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url = new URL(req.url);
    if (url.pathname !== '/api/campaign') return json({ error: 'not found' }, 404);

    const id = req.headers.get('x-client-id') || env.TILTIFY_CLIENT_ID;
    const secret = req.headers.get('x-client-secret') || env.TILTIFY_CLIENT_SECRET;
    const campaign = url.searchParams.get('campaign') || env.TILTIFY_CAMPAIGN_ID;
    if (!id || !secret || !campaign) return json({ error: 'missing id, secret or campaign' }, 400);

    const key = `${id}:${campaign}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return json(hit.body);

    try {
      const body = await load(id, secret, campaign);
      cache.set(key, { at: Date.now(), body });
      return json(body);
    } catch (e) {
      if (hit) return json(hit.body);
      return json({ error: e.message }, e.status || 502);
    }
  },
};
