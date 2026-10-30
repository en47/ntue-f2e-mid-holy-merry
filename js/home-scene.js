import { mountHomeScene } from './components/home-scene.js';

// The pop-up opening replays once its sheets are decoded, so nothing unfolds half-painted.
const storybook = document.querySelector('.storybook');
storybook.classList.add('is-preparing');
mountHomeScene(storybook).then(() => {
  storybook.classList.remove('is-preparing');
  document.querySelector('#replay-story').click();
});
