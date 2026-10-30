import { initChristmasMatchingGame } from './game2-matching.js';

const root = document.querySelector('#matching-app');
let game = initChristmasMatchingGame(root);
window.addEventListener('pagehide', () => game.destroy());
window.addEventListener('pageshow', event => {
  if (event.persisted) game = initChristmasMatchingGame(root);
});
