// Page titles as paper letters that wobble like the Home and Intro titles; screen readers keep the words.
import { paperLayer, shape } from './paper-art.js';
import { headingGlyphs } from '../data/heading-glyphs.js';

const PALETTE = ['#a84a42', '#b5604a', '#4f7d68', '#a84a42', '#c08a3e'];

export function mountTitleArt(title, key, { palette = PALETTE, rim = '#fbf3e3' } = {}) {
  const { box, ratio, glyphs } = headingGlyphs[key];
  const words = document.createElement('span'), art = document.createElement('span');
  words.className = 'sr-only'; words.textContent = title.textContent.replace(/\s+/g, ' ').trim();
  art.className = 'title-art'; art.style.aspectRatio = ratio; art.setAttribute('aria-hidden', 'true');
  glyphs.forEach(({ d, pivot }, index) => {
    const letter = paperLayer(art, box, 'title-letter', parent => shape('path', { d, fill: palette[index % palette.length] }, parent),
      { paper: { scale: 1.8, grain: .4, shadow: .2, rim }, origin: pivot, eager: true });
    letter.style.animationDelay = `${-(index * 1.37) % 3.4}s`;
  });
  title.replaceChildren(words, art);
}
