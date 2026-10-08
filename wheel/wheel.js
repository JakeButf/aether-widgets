import { subscribe } from '../shared/api.js';
import { applyTheme, param, money, fitText } from '../shared/util.js';

applyTheme();

const step = Math.round(Number(param('step', 100)) * 100);
const offset = Math.round(Number(param('offset', 0)) * 100);
const decimals = Number(param('decimals', 0));
const prefix = param('prefix', '$');

const card = document.getElementById('card');
const fill = document.getElementById('fill');
const label = document.getElementById('label');
const value = document.getElementById('value');
label.textContent = param('label', 'next wheel spin:');

fitText(label);
const fitValue = fitText(value);

let lastSpins = null;

subscribe((data) => {
  const cents = Math.max(0, Math.round(data.total * 100) - offset);
  const spins = Math.floor(cents / step);
  const progress = cents % step;

  fill.style.width = (progress / step) * 100 + '%';
  value.textContent = `${prefix}${money(progress / 100, decimals)}/${prefix}${money(step / 100, decimals)}`;
  fitValue();

  if (lastSpins !== null && spins > lastSpins) {
    card.animate(
      [{ filter: 'brightness(2.2)', transform: 'scale(1.04)' }, { filter: 'none', transform: 'none' }],
      { duration: 1200, easing: 'ease-out' }
    );
  }
  lastSpins = spins;
});
