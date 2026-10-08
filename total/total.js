import { subscribe } from '../shared/api.js';
import { applyTheme, param, money, fitText, countUp } from '../shared/util.js';

applyTheme();

const labelText = param('label', '');
const prefix = param('prefix', '$');
const decimals = Number(param('decimals', 0));
const offset = Number(param('offset', 0));

document.body.classList.add('align-' + param('align', 'right'));
if (!labelText) document.body.classList.add('no-label');

const label = document.getElementById('label');
const value = document.getElementById('value');
label.textContent = labelText;

fitText(label);
const fitValue = fitText(value);

let shown = 0;

subscribe((data) => {
  const target = data.total + offset;
  if (target === shown) return;
  countUp(shown, target, 1500, (v) => {
    value.textContent = prefix + money(v, decimals);
    fitValue();
  });
  shown = target;
});
