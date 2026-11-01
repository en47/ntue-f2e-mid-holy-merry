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
    home: '<div class="cradle"><svg class="bar" viewBox="0 -34 328 96" aria-hidden="true"><path d="M14 18C70 15 250 15 314 19 323 20 326 27 325 38 324 50 320 55 312 55 250 58 80 58 16 55 7 54 3 49 3 38 3 26 6 19 14 18Z" fill="#6f4a33" transform="translate(0 4)"/><path d="M14 18C70 15 250 15 314 19 323 20 326 27 325 38 324 50 320 55 312 55 250 58 80 58 16 55 7 54 3 49 3 38 3 26 6 19 14 18Z" fill="#a8744d"/><path d="M12 22C70 19 250 19 316 23 321 24 323 27 323 30 250 26 80 26 6 30 6 26 8 23 12 22Z" fill="#c4915f"/><path d="M20 42C80 38 120 45 170 41S270 38 308 43M26 49C90 46 150 52 210 48S290 47 304 49M60 37C78 35 96 36 108 38M190 36C212 34 236 35 254 37" fill="none" stroke="#7f5438" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><ellipse cx="88" cy="46" rx="9" ry="4.4" fill="none" stroke="#7f5438" stroke-width="1.6"/><ellipse cx="88" cy="46" rx="4" ry="1.8" fill="#7f5438"/><ellipse cx="14" cy="37" rx="11" ry="19" fill="#d9b285" stroke="#8c5f40" stroke-width="2.4"/><ellipse cx="14" cy="37" rx="6.6" ry="12" fill="none" stroke="#a8744d" stroke-width="1.5"/><ellipse cx="14" cy="37" rx="2.6" ry="5" fill="none" stroke="#a8744d" stroke-width="1.5"/><path d="M38 15C37 28 37 44 39 58L51 58C49 44 49 28 50 15Z" fill="#ad3c3b"/><path d="M42 15C41 28 41 44 43 58M46 15C45 28 45 44 47 58" fill="none" stroke="#fff3dc" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="4 3"/><path d="M277 15C276 28 276 44 278 58L290 58C288 44 288 28 289 15Z" fill="#ad3c3b"/><path d="M281 15C280 28 280 44 282 58M285 15C284 28 284 44 286 58" fill="none" stroke="#fff3dc" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="4 3"/><path d="M6 21C8 8 26 4 44 8 58 0 84 2 100 8 122-1 150 1 164 6 182-2 212 0 226 8 246 1 276 2 288 9 304 5 320 9 324 22 318 26 312 22 304 27 298 31 292 24 280 25 270 26 268 32 260 32 252 32 250 25 238 24 222 23 214 29 204 28 194 27 190 22 176 22 160 22 156 28 146 28 136 28 132 23 118 23 104 23 100 31 90 31 80 31 78 24 66 24 54 24 50 28 40 27 30 26 24 23 18 25 12 27 8 26 6 21Z" fill="#fbf8f1"/><path d="M44 8C58 0 84 2 100 8M164 6C182-2 212 0 226 8" fill="none" stroke="#cfe1e7" stroke-width="2" stroke-linecap="round"/><path d="M164 4c-7-9-19-11-30-6 3 3 3 6 1 8 3 0 6 1 7 4 2-2 5-2 7 0 1-3 2-5 5-5 3 0 7 1 10-1Z" fill="#42675b"/><path d="M164 4c7-9 19-11 30-6-3 3-3 6-1 8-3 0-6 1-7 4-2-2-5-2-7 0-1-3-2-5-5-5-3 0-7 1-10-1Z" fill="#5f8a70"/><circle cx="158" cy="2" r="4.6" fill="#ad3c3b"/><circle cx="170" cy="2" r="4.6" fill="#87302f"/><circle cx="164" cy="-4" r="4.6" fill="#c2544a"/><circle cx="162.6" cy="-5.4" r="1.3" fill="#ffe9d8"/><circle cx="62.4" cy="33" r="4.4" fill="#8f6b2e"/><circle cx="62.4" cy="32" r="3.2" fill="#e3b95f"/><circle cx="61.4" cy="31" r="1" fill="#fbecc4"/><circle cx="113.8" cy="33" r="4.4" fill="#8f6b2e"/><circle cx="113.8" cy="32" r="3.2" fill="#e3b95f"/><circle cx="112.8" cy="31" r="1" fill="#fbecc4"/><circle cx="164" cy="33" r="4.4" fill="#8f6b2e"/><circle cx="164" cy="32" r="3.2" fill="#e3b95f"/><circle cx="163" cy="31" r="1" fill="#fbecc4"/><circle cx="214.2" cy="33" r="4.4" fill="#8f6b2e"/><circle cx="214.2" cy="32" r="3.2" fill="#e3b95f"/><circle cx="213.2" cy="31" r="1" fill="#fbecc4"/><circle cx="265.6" cy="33" r="4.4" fill="#8f6b2e"/><circle cx="265.6" cy="32" r="3.2" fill="#e3b95f"/><circle cx="264.6" cy="31" r="1" fill="#fbecc4"/></svg>' +
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
    // The room opens once the letters hang on the tree, so nobody sees it bare; the time cap covers a slow mailbox.
    wish: function () { var scene = document.querySelector('#scene-loading'); if (!scene || !scene.hidden) return false; var room = scene.parentElement.dataset; return room.cloud !== undefined && Number(room.envelopes || 0) >= Number(room.cloud); },
  };
  function finish() {
    if (done) return; done = true; clearTimeout(timer);
    root.classList.remove('is-loading');
    window.dispatchEvent(new Event('site-loader:done'));
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
