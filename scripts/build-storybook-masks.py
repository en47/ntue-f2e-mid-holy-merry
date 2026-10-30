"""從對位輪廓產生 SVG alpha 遮罩；不改寫任何原始 PNG。"""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'docs/STORYBOOK-MASKS.json').read_text())
for name, item in manifest.items():
    w, h = item['size']
    fit = item.get('preserveAspectRatio', 'none')
    outlines = item['polygons'] + item.get('holes', [])
    path = ' '.join('M' + ' L'.join(f'{x},{y}' for x, y in polygon) + ' Z' for polygon in outlines)
    (ROOT / item['mask']).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="{fit}"><path fill="white" fill-rule="evenodd" d="{path}"/></svg>\n')
