// Flip-calendar digits: the old top leaf falls, then the new bottom leaf lands. Only digits that change flip.
const FACES = ['flip-top', 'flip-bottom', 'flip-leaf flip-leaf-top', 'flip-leaf flip-leaf-bottom'];

function createCard(digit, motion) {
  const root = document.createElement('span');
  root.className = 'flip-card';
  const [top, bottom, leafTop, leafBottom] = FACES.map(name => {
    const face = document.createElement('span'), text = document.createElement('b');
    face.className = name; text.textContent = digit;
    face.append(text); root.append(face);
    return { face, text };
  });
  let current = digit;
  const settle = () => { bottom.text.textContent = current; root.classList.remove('is-flipping'); };
  leafBottom.face.addEventListener('animationend', settle);
  return {
    root,
    show(next) {
      if (next === current) return;
      const previous = current;
      current = next;
      if (motion.matches) { [top, bottom, leafTop, leafBottom].forEach(part => { part.text.textContent = next; }); return; }
      top.text.textContent = next; bottom.text.textContent = previous;
      leafTop.text.textContent = previous; leafBottom.text.textContent = next;
      root.classList.remove('is-flipping');
      void root.offsetWidth; // Restart the leaves if the last flip has not landed yet.
      root.classList.add('is-flipping');
    },
  };
}

export function mountFlipCounter(element) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cards = [];
  return {
    set(value) {
      const digits = [...value];
      // Days drop from three digits to two; a new width has nothing to flip from.
      if (digits.length !== cards.length) {
        cards = digits.map(digit => createCard(digit, motion));
        element.replaceChildren(...cards.map(card => card.root));
        return;
      }
      digits.forEach((digit, index) => cards[index].show(digit));
    },
  };
}
