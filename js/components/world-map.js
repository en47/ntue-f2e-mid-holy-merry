export function mountWorldMap(container, points, onSelect) {
  const buttons = [];
  for (const point of points) {
    const button = document.createElement('button');
    button.className = 'map-point';
    button.textContent = point.label;
    button.dataset.country = point.id;
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-controls', 'country-card');
    button.addEventListener('click', () => onSelect(point.id, button));
    container.append(button);
    buttons.push(button);
  }
  return {
    select(id) { buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.country === id))); },
    clear() { buttons.forEach(button => button.setAttribute('aria-pressed', 'false')); },
  };
}
