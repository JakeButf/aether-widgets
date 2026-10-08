import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../worker/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8787;
const everyMs = Number(process.env.EVERY) || 5000;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const names = ['cjnah', null, 'xX_Hank_Xx', 'JakeZSR', 'TestUsername10001', 'IRanOutOfGoodUsernameIdeasLol'];
const comments = ['Good luck', null, 'this widget sure is awesome hopefully its working', 'save the animals', '', 'hey guys just wanted to say what is up. im writing out a really long message. hopefully you read it. if not im charging back so'];

let total = Number(process.env.START) || 0;
let donations = [];

function addDonation() {
  const big = Math.random() < 0.2;
  const amount = big ? 150 + Math.floor(Math.random() * 250) : 5 + Math.floor(Math.random() * 45);
  const i = Math.floor(Math.random() * names.length);
  total += amount;
  donations.unshift({
    id: crypto.randomUUID(),
    donor_name: names[i],
    amount: { value: amount.toFixed(2), currency: 'USD' },
    donor_comment: comments[i],
    completed_at: new Date().toISOString(),
  });
  donations = donations.slice(0, 50);
  console.log(`fake donation $${amount} -> total $${total}`);
}

setInterval(addDonation, everyMs);

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const u = new URL(url);
  if (u.host !== 'v5api.tiltify.com') return realFetch(url, init);
  const reply = (body) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
  if (u.pathname === '/oauth/token') return reply({ access_token: 'fake', expires_in: 7200, token_type: 'bearer' });
  if (u.pathname.endsWith('/donations')) {
    const limit = Number(u.searchParams.get('limit')) || 10;
    return reply({ data: donations.slice(0, limit), metadata: { limit } });
  }
  return reply({
    data: {
      amount_raised: { value: total.toFixed(2), currency: 'USD' },
      goal: { value: '20000', currency: 'USD' },
    },
  });
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname === '/api/campaign') {
      const r = await worker.fetch(new Request(url, { headers: req.headers }), {});
      res.writeHead(r.status, Object.fromEntries(r.headers));
      res.end(await r.text());
      return;
    }
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        res.writeHead(301, { location: url.pathname + '/' + url.search }).end();
        return;
      }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log(`widgets on http://localhost:${port}`);
    console.log(`try /wheel/?preview&campaign=test&id=a&secret=b&api=http://localhost:${port}/api/campaign`);
  });
