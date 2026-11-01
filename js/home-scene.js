import { mountHomeScene } from './components/home-scene.js';

// The pop-up opening replays once its sheets are decoded, so nothing unfolds half-painted.
const storybook = document.querySelector('.storybook');
storybook.classList.add('is-preparing');
mountHomeScene(storybook).then(() => {
  storybook.classList.remove('is-preparing');
  document.querySelector('#replay-story').click();
});
// Replaying the opening also replays the title; the automatic start above must not.
document.querySelector('#replay-story').addEventListener('click', event => {
  if (!event.isTrusted) return;
  storybook.classList.remove('title-ready'); void storybook.offsetWidth; storybook.classList.add('title-ready');
});
