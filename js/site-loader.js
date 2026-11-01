// Runs before anything paints: each page opens on its own paper-cut loader and only shows once it is ready.
// A classic script on purpose. If it never runs, the page simply shows as normal.
(function () {
  var MAX_WAIT = 12000, FIRST_VISIT = 1300;
  var page = document.body.dataset.loader || 'home';
  var root = document.documentElement;
  var snow = '<svg class="loader-snow" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true"><path class="loader-hill" d="M0 96C170 56 300 118 480 92S760 44 960 88 1260 118 1440 70V240H0Z"/><path class="loader-ground" d="M0 150C220 110 360 160 590 136S940 92 1150 136 1340 150 1440 118V240H0Z"/></svg>';
  var egg = function (index, file) { return '<div class="egg-item egg-' + index + '"><img src="assets/illustrations/loading/' + file + '.png" alt=""></div>'; };
  var gondola = function (angle, fill) { return '<g transform="rotate(' + angle + ' 120 120) translate(120 22)"><g class="loader-seat"><g transform="rotate(' + -angle + ')"><path d="M0 0V10" stroke="#8a6a55" stroke-width="3"/><path d="M-13 10H13L10 28C6 32-6 32-10 28Z" fill="' + fill + '"/><path d="M-15 11C-8 2 8 2 15 11Z" fill="#fbf3e3"/></g></g></g>'; };
  var spokes = ''; var seats = ''; var colours = ['#a84a42', '#7fa3a8', '#d9a441', '#4f7d68'];
  for (var i = 0; i < 8; i++) { spokes += '<path d="M120 120V22" transform="rotate(' + i * 45 + ' 120 120)"/>'; seats += gondola(i * 45, colours[i % 4]); }
  var scenes = {
    home: '<div class="cradle"><svg class="bar" viewBox="0 0 328 62" aria-hidden="true"><path d="M78-1200V30M250-1200V30" stroke="#a84a42" stroke-width="5" fill="none"/><path d="M14 18C70 15 250 15 314 19 323 20 326 27 325 38 324 50 320 55 312 55 250 58 80 58 16 55 8 54 4 49 4 38 4 26 6 19 14 18Z" fill="#6d5242" transform="translate(0 3)"/><path d="M14 18C70 15 250 15 314 19 323 20 326 27 325 38 324 50 320 55 312 55 250 58 80 58 16 55 8 54 4 49 4 38 4 26 6 19 14 18Z" fill="#a98a6c" stroke="#f6ecda" stroke-width="2.5"/><path d="M6 44C80 40 250 40 322 44 322 50 320 55 312 55 250 58 80 58 16 55 8 54 6 50 6 44Z" fill="#8c6e55"/><path d="M8 22C60 9 268 9 320 22 322 28 306 28 298 24 284 31 262 29 252 23 232 29 206 28 194 22 172 29 146 29 134 22 116 30 92 28 80 23 66 31 40 29 32 24 22 29 8 29 8 22Z" fill="#fbf8f1"/></svg>' +
      egg(1, 'red') + egg(2, 'green') + egg(3, 'yellow') + egg(4, 'green') + egg(5, 'red') + '</div><img class="loader-word" src="assets/illustrations/loading/loading.png" alt="">',
    intro: '<svg class="loader-art" viewBox="0 0 320 200" aria-hidden="true"><path d="M10 188C60 166 120 170 160 186 200 170 260 166 310 188V196H10Z" fill="#8c5a44"/><path d="M160 180C120 158 70 156 24 174V44C70 26 120 28 160 50Z" fill="#fbf3e3"/><path d="M160 180C200 158 250 156 296 174V44C250 26 200 28 160 50Z" fill="#f4e7cf"/><path d="M50 72C80 62 110 62 138 74M50 96C80 86 110 86 138 98M50 120C80 110 110 110 138 122M182 74C210 62 240 62 270 72M182 98C210 86 240 86 270 96M182 122C210 110 240 110 270 120" stroke="#d9c5a2" stroke-width="4" stroke-linecap="round" fill="none"/><g class="loader-leaf"><path d="M160 180C200 158 250 156 296 174V44C250 26 200 28 160 50Z" fill="#fff9ec" stroke="#e6d3b0" stroke-width="2"/></g><g class="loader-leaf loader-leaf-b"><path d="M160 180C200 158 250 156 296 174V44C250 26 200 28 160 50Z" fill="#fdf3df" stroke="#e6d3b0" stroke-width="2"/></g><path d="M160 50V180" stroke="#c9a877" stroke-width="3"/></svg><p class="loader-caption">故事翻開中……</p>',
    game: '<svg class="loader-art loader-wheel-art" viewBox="0 0 240 260" aria-hidden="true"><path d="M120 120L58 252H76L120 156 164 252H182Z" fill="#a98c6f"/><g class="loader-wheel"><circle cx="120" cy="120" r="98" fill="none" stroke="#b68f6a" stroke-width="8"/><circle cx="120" cy="120" r="66" fill="none" stroke="#c9ad8d" stroke-width="4"/><g stroke="#b68f6a" stroke-width="4">' + spokes + '</g>' + seats + '</g><circle cx="120" cy="120" r="12" fill="#dcae55"/></svg><p class="loader-caption">遊樂園開門中……</p>',
    wish: '<svg class="loader-art" viewBox="0 0 320 210" aria-hidden="true"><g class="loader-stars" fill="#f3df9e"><path d="M40 40l4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1Z"/><path d="M270 24l3 8 9 1-7 6 3 9-8-5-8 5 3-9-7-6 9-1Z"/><path d="M290 130l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z"/><path d="M26 140l2 6 7 1-5 4 2 7-6-4-6 4 2-7-5-4 7-1Z"/></g><path d="M20 180C90 90 230 90 300 34" fill="none" stroke="#6f8ba5" stroke-width="3" stroke-dasharray="3 11" stroke-linecap="round"/><g class="loader-envelope"><path d="M-44-30H44C49-30 52-27 52-22V22C52 27 49 30 44 30H-44C-49 30-52 27-52 22V-22C-52-27-49-30-44-30Z" fill="#f7e7c6"/><path d="M-50-28L0 10 50-28Z" fill="#ecd6ab"/><circle cy="6" r="11" fill="#a84a42"/></g></svg><p class="loader-caption">星星點亮中……</p>',
  };
  var loader = document.createElement('div');
  loader.className = 'site-loader site-loader-' + page;
  loader.setAttribute('role', 'status'); loader.setAttribute('aria-label', '網頁載入中');
  loader.innerHTML = snow + '<div class="loader-stage">' + (scenes[page] || scenes.home) + '</div>';
  root.classList.add('is-loading');
  document.body.prepend(loader);

  var seen = false;
  try { seen = sessionStorage.getItem('holy-merry:loader:' + page) === '1'; sessionStorage.setItem('holy-merry:loader:' + page, '1'); } catch (error) { /* A convenience only. */ }
  var started = Date.now(), minimum = seen ? 0 : FIRST_VISIT, done = false, loaded = document.readyState === 'complete', timer = 0;
  var ready = {
    home: function () { var slots = document.querySelectorAll('[data-model-slot]'); if (!slots.length) return false; for (var i = 0; i < slots.length; i++) if (slots[i].dataset.state === 'loading') return false; return true; },
    intro: function () { return document.querySelector('#intro-storybook.is-opening'); },
    game: function () { var slot = document.querySelector('.games-hero-santa'); return slot && slot.dataset.state !== 'loading'; },
    wish: function () { var scene = document.querySelector('#scene-loading'); return scene && scene.hidden; },
  };
  function finish() {
    if (done) return; done = true; clearTimeout(timer);
    root.classList.remove('is-loading');
    loader.classList.add('is-done');
    setTimeout(function () { loader.remove(); }, 450);
  }
  function check() {
    var elapsed = Date.now() - started;
    if (elapsed >= MAX_WAIT || (loaded && elapsed >= minimum && (ready[page] || function () { return true; })())) { finish(); return; }
    timer = setTimeout(check, 120);
  }
  addEventListener('load', function () { loaded = true; });
  check();
}());
