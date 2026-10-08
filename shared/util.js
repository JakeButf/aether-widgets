const q = new URLSearchParams(location.search);
export const param = (k, d) => (q.has(k) ? q.get(k) : d);

const COLORS = ['bg', 'fg', 'accent', 'track', 'border', 'text', 'amount', 'name', 'comment'];
const SIZES = ['radius', 'pad', 'bw'];

export function applyTheme() {
  const root = document.documentElement;
  if (q.has('preview')) root.classList.add('preview');

  for (const k of [...COLORS, ...SIZES]) {
    let v = q.get(k);
    if (!v) continue;
    if (COLORS.includes(k) && /^[0-9a-f]{3,8}$/i.test(v)) v = '#' + v;
    if (SIZES.includes(k) && /^[\d.]+$/.test(v)) v += 'px';
    root.style.setProperty('--' + k, v);
  }

  const font = q.get('font') || 'Barlow Condensed';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;700;800&display=swap`;
  document.head.appendChild(link);
  root.style.setProperty('--font', `"${font}", sans-serif`);
  document.fonts.ready.then(() => window.dispatchEvent(new Event('resize')));
}

export function money(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fitText(el) {
  const box = el.parentElement;
  const fit = () => {
    let lo = 4;
    let hi = Math.max(8, box.clientHeight);
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = mid + 'px';
      if (el.offsetWidth <= box.clientWidth && el.offsetHeight <= box.clientHeight) lo = mid;
      else hi = mid;
    }
    el.style.fontSize = lo + 'px';
  };
  new ResizeObserver(fit).observe(box);
  fit();
  return fit;
}

export function countUp(from, to, ms, onFrame) {
  const start = performance.now();
  function step(now) {
    const p = Math.min(1, (now - start) / ms);
    onFrame(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
