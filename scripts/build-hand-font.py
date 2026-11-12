#!/usr/bin/env python3
"""Build the site's handwriting font (--font-hand) from Iansui 芫荽 (SIL OFL 1.1, assets/fonts/IANSUI-LICENSE.txt).

Requires fontTools and brotli (pip install fonttools brotli). The source font is downloaded once from the Google Fonts
repository and checked against its SHA-256 (or pass its path as the first argument). Two subsets are cut:

- iansui-site.woff2: every character the site's own pages, scripts and styles use, plus ASCII. Its @font-face lists
  exactly those characters (unicode-range), so it is the one used for them.
- iansui-common.woff2: the rest of the Big5 common characters (常用字), for what visitors write themselves (a wish's
  signature). The browser downloads it only when such a character is on the page.

The two @font-face rules are written into css/shared.css between the hand-font markers, and docs/HAND-FONT.json keeps the
characters and hashes; tests/smoke.mjs fails when a page uses a character the subset was not cut with (run this again).
"""
import hashlib, json, pathlib, re, sys, tempfile, urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = 'https://github.com/google/fonts/raw/main/ofl/iansui/Iansui-Regular.ttf'
SOURCE_SHA = '6e6340d80d618a42b48ade9370c34fa37a8210750c6fbc8efe65f23716538a2b'
# The generated glyph tables hold only path data, never text shown in the hand.
SKIP = {'js/data/title-glyphs.js', 'js/data/heading-glyphs.js', 'js/data/cabin-cuts.js'}
EXTRA = '‘’“”…–—·•'
CJK = 'U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF'


def site_text():
    files = [*ROOT.glob('*.html'), *ROOT.glob('games/*.html'), *ROOT.glob('js/**/*.js'), *ROOT.glob('css/*.css')]
    return set(''.join(path.read_text('utf8') for path in sorted(files) if path.relative_to(ROOT).as_posix() not in SKIP))


def big5_common():
    chars = set()
    for hi in range(0xA4, 0xC7):
        for lo in [*range(0x40, 0x7F), *range(0xA1, 0xFF)]:
            if (hi, lo) > (0xC6, 0x7E): continue
            try: chars.add(bytes([hi, lo]).decode('big5'))
            except UnicodeDecodeError: pass
    return chars


def ranges(points):
    points, out = sorted(points), []
    for point in points:
        if out and point == out[-1][1] + 1: out[-1][1] = point
        else: out.append([point, point])
    return ','.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in out)


def cut(font_path, chars, output):
    options = subset.Options(); options.flavor = 'woff2'; options.layout_features = ['*']; options.hinting = False; options.name_IDs = ['*']
    font = subset.load_font(str(font_path), options)
    subsetter = subset.Subsetter(options); subsetter.populate(text=''.join(sorted(chars))); subsetter.subset(font)
    subset.save_font(font, str(output), options)


def main():
    source = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(tempfile.gettempdir()) / 'Iansui-Regular.ttf'
    if not source.exists(): urllib.request.urlretrieve(URL, source)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert digest == SOURCE_SHA, f'Iansui source changed ({digest}); check the new release before updating SOURCE_SHA'
    cmap = TTFont(source).getBestCmap()
    used = {char for char in site_text() if ord(char) > 0x7E}
    missing = sorted(char for char in used if ord(char) > 0x2E7F and ord(char) not in cmap)
    assert not missing, f'Iansui has no glyph for: {"".join(missing)}'
    site = {char for char in used | set(EXTRA) if ord(char) in cmap} | {chr(c) for c in range(0x20, 0x7F)}
    common = {char for char in big5_common() if ord(char) in cmap} - site
    fonts = ROOT / 'assets/fonts'
    cut(source, site, fonts / 'iansui-site.woff2'); cut(source, common, fonts / 'iansui-common.woff2')
    # The common face covers the CJK blocks as a whole; the site's face, written after it, wins for its own characters.
    face = lambda file, span: f"@font-face {{ font-family: Iansui; src: url('../assets/fonts/{file}') format('woff2'); font-display: swap; unicode-range: {span}; }}"
    block = '/* hand-font:start（scripts/build-hand-font.py 產生，不要手改） */\n' + face('iansui-common.woff2', CJK) + '\n' + face('iansui-site.woff2', ranges(ord(c) for c in site)) + '\n/* hand-font:end */'
    css = ROOT / 'css/shared.css'
    text = css.read_text('utf8')
    text = re.sub(r'/\* hand-font:start.*?/\* hand-font:end \*/', lambda _: block, text, flags=re.S) if 'hand-font:start' in text else text.replace("@import url('./tokens.css');\n", "@import url('./tokens.css');\n" + block + '\n', 1)
    css.write_text(text, 'utf8')
    sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    manifest = {'source': {'name': 'Iansui-Regular.ttf', 'url': URL, 'sha256': SOURCE_SHA, 'license': 'SIL OFL 1.1'},
                'files': {name: sha(fonts / name) for name in ['iansui-site.woff2', 'iansui-common.woff2']},
                'site': ''.join(sorted(site)), 'common': len(common)}
    (ROOT / 'docs/HAND-FONT.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', 'utf8')
    print(f"site {len(site)} chars {(fonts / 'iansui-site.woff2').stat().st_size // 1024} KB; common {len(common)} chars {(fonts / 'iansui-common.woff2').stat().st_size // 1024} KB")


if __name__ == '__main__':
    main()
