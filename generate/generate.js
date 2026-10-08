const $ = (id) => document.getElementById(id);

const TEXT_FIELDS = ['campaign', 'id', 'secret', 'font'];
const COLOR_FIELDS = ['accent', 'fg', 'bg'];
const SIZES = { wheel: [400, 160], total: [400, 120], donations: [340, 240] };

function build() {
  const widget = $('widget').value;
  const params = new URLSearchParams();

  for (const key of TEXT_FIELDS) {
    const value = $(key).value.trim();
    if (value) params.set(key, value);
  }
  for (const key of COLOR_FIELDS) {
    const value = $(key).value.trim().replace(/^#/, '');
    if (value) params.set(key, value);
  }

  const layout = $('layout').value;
  if (widget === 'donations' && layout !== 'cycle') {
    params.set('mode', 'list');
    if (layout === 'row') params.set('dir', 'row');
  }

  const base = new URL(`../${widget}/`, location.href).href;
  return { base, query: params.toString() };
}

function resize() {
  const w = Number($('pw').value) || 400;
  const h = Number($('ph').value) || 160;
  const stage = $('stage');
  const scale = Math.min(1, (stage.clientWidth - 24) / w);
  const frame = $('frame');
  frame.style.width = `${w}px`;
  frame.style.height = `${h}px`;
  frame.style.transform = `scale(${scale})`;
  stage.style.height = `${h * scale + 24}px`;
}

function update() {
  const widget = $('widget').value;
  $('layout-row').hidden = widget !== 'donations';

  const { base, query } = build();
  $('out').value = query ? `${base}?${query}` : base;

  const extra = $('demo').checked ? 'preview&demo' : 'preview';
  $('frame').src = `${base}?${query}${query ? '&' : ''}${extra}`;
}

function changeWidget() {
  const [w, h] = SIZES[$('widget').value];
  $('pw').value = w;
  $('ph').value = h;
  resize();
  update();
}

$('widget').addEventListener('change', changeWidget);
for (const id of [...TEXT_FIELDS, ...COLOR_FIELDS, 'layout', 'demo']) $(id).addEventListener('input', update);
for (const id of ['pw', 'ph']) $(id).addEventListener('input', resize);
window.addEventListener('resize', resize);

$('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('out').value);
  $('copy').textContent = 'Copied';
  setTimeout(() => ($('copy').textContent = 'Copy URL'), 1500);
});

changeWidget();
