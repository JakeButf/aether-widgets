import { subscribe } from '../shared/api.js';
import { applyTheme, param, money } from '../shared/util.js';

applyTheme();

const mode = param('mode', 'cycle');
const count = Math.max(1, Number(param('count', mode === 'list' ? 5 : 10)));
const interval = Math.max(2, Number(param('interval', 6))) * 1000;
const minAmount = Number(param('min', 0));
const showComments = param('comments', '1') !== '0';
const prefix = param('prefix', '$');
const decimals = Number(param('decimals', 0));

const box = document.getElementById('box');
box.classList.add(mode);
if (param('dir', 'column') === 'row') box.classList.add('row');

let donations = [];
const seen = new Set();
let first = true;
let index = 0;
let timer = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const fmt = (a) => prefix + money(a, a % 1 ? 2 : decimals);

function renderList(fresh) {
  box.replaceChildren();
  box.style.setProperty('--n', count);
  if (!donations.length) {
    box.append(el('div', 'empty', 'No donations yet'));
    return;
  }
  for (const d of donations) {
    const item = el('div', 'item');
    const top = el('div', 'top');
    top.append(el('span', 'amount', fmt(d.amount)), el('span', 'name', d.name));
    item.append(top);
    if (showComments) item.append(el('div', 'comment', d.comment));
    box.append(item);
    if (fresh.has(d.id)) {
      item.animate([{ background: 'var(--accent)' }, { background: 'transparent' }], { duration: 800, easing: 'ease-out' });
    }
  }
}

function showSlide() {
  box.replaceChildren();
  if (!donations.length) {
    box.append(el('div', 'empty', 'No donations yet'));
    return;
  }
  const d = donations[index % donations.length];
  index++;
  const slide = el('div', 'slide');
  slide.append(el('div', 'amount', fmt(d.amount)), el('div', 'name', d.name));
  if (showComments) slide.append(el('div', 'comment', d.comment));
  box.append(slide);
  setTimeout(() => slide.classList.add('on'), 50);
}

function startCycle() {
  clearInterval(timer);
  index = 0;
  showSlide();
  timer = setInterval(showSlide, interval);
}

subscribe((data) => {
  donations = data.donations.filter((d) => d.amount >= minAmount).slice(0, count);
  const fresh = new Set(first ? [] : donations.filter((d) => !seen.has(d.id)).map((d) => d.id));
  donations.forEach((d) => seen.add(d.id));
  first = false;

  if (mode === 'list') renderList(fresh);
  else if (fresh.size || !timer) startCycle();
});
