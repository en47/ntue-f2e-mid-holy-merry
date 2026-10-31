# 描 assets/illustrations/intro/christmas_map.jpg 的陸地輪廓，產生 js/data/intro-map-shapes.js。
# 座標沿用原圖 1728×947，六個國家紅點不必換算。需要 opencv-python-headless 與 numpy。
import json, sys
import cv2
import numpy as np

image = cv2.imread('assets/illustrations/intro/christmas_map.jpg')
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
land = cv2.inRange(hsv, (20, 35, 90), (55, 255, 255))
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
land = cv2.morphologyEx(cv2.morphologyEx(land, cv2.MORPH_OPEN, kernel), cv2.MORPH_CLOSE, kernel)
# 內海是輪廓裡的洞，保留下來並以 evenodd 填色。
contours, _ = cv2.findContours(land, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)

def smooth(points):
    # 由中點接二次曲線，保留手繪起伏，又不會有折線感。
    count = len(points)
    mid = lambda a, b: ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    start = mid(points[-1], points[0])
    parts = [f'M{start[0]:.0f} {start[1]:.0f}']
    for index in range(count):
        end = mid(points[index], points[(index + 1) % count])
        parts.append(f'Q{points[index][0]} {points[index][1]} {end[0]:.0f} {end[1]:.0f}')
    return ''.join(parts) + 'Z'

shapes = []
for contour in sorted(contours, key=cv2.contourArea, reverse=True):
    if cv2.contourArea(contour) < 140: continue
    points = cv2.approxPolyDP(contour, 1.8, True).reshape(-1, 2).tolist()
    shapes.append(smooth(points))
with open('js/data/intro-map-shapes.js', 'w') as out:
    out.write('// 由 scripts/build-intro-map.py 產生，請勿手改。\n')
    out.write(f"export const MAP_BOX = '0 0 1728 947';\nexport const mapLand = {json.dumps(shapes)};\n")
print(len(shapes), 'shapes', sum(len(s) for s in shapes), 'bytes', file=sys.stderr)
