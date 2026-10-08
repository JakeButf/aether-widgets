import { DEFAULT_API } from './config.js';

const q = new URLSearchParams(location.search);
const demo = q.has('demo');

const NAMES = ['Zombie_Slayer', 'Anonymous', 'xX_Hank_Xx', 'GlitchyGoblin', 'Maria', 'Dr. Brains'];
const COMMENTS = ['Good luck!!', '', 'For Wings for Life!', 'Spin the wheel!', '', 'brains... brains...'];

let fake = { total: 0, goal: 0, currency: 'USD', donations: [] };

function fakeDonation() {
  const big = Math.random() < 0.15;
  const amount = big ? 150 + Math.floor(Math.random() * 200) : 5 + Math.floor(Math.random() * 45);
  const i = Math.floor(Math.random() * NAMES.length);
  fake.total += amount;
  fake.donations.unshift({ id: String(Date.now()), name: NAMES[i], amount, comment: COMMENTS[i], at: new Date().toISOString() });
  fake.donations = fake.donations.slice(0, 25);
  return fake;
}

async function fetchLive() {
  const headers = {};
  if (q.get('id')) headers['x-client-id'] = q.get('id');
  if (q.get('secret')) headers['x-client-secret'] = q.get('secret');
  const base = q.get('api') || DEFAULT_API;
  const r = await fetch(`${base}?campaign=${encodeURIComponent(q.get('campaign') || '')}`, { headers });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

export function subscribe(callback) {
  async function poll() {
    try {
      callback(demo ? fakeDonation() : await fetchLive());
    } catch (e) {
      console.warn('poll failed:', e.message);
    }
  }
  poll();
  setInterval(poll, demo ? 4000 : Math.max(3, Number(q.get('poll')) || 10) * 1000);
}
