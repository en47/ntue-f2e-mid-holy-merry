"""Read original PNG alpha; emit lightweight Three.js contours, never edit images."""
from pathlib import Path
from collections import deque, defaultdict
from hashlib import sha256
from PIL import Image
import json, math

ROOT = Path(__file__).resolve().parents[1]
STEP, THRESHOLD = 4, 128

def area(points):
    return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points, points[1:]+points[:1]))/2

def simplify(points, tolerance=1.4):
    # Iteratively remove only near-collinear samples. Retain the paper silhouette.
    result=points[:]
    while len(result)>3:
        remove=None; smallest=tolerance
        for i,p in enumerate(result):
            a,b=result[i-1],result[(i+1)%len(result)]
            length=math.hypot(b[0]-a[0],b[1]-a[1])
            if not length:distance=0
            else:distance=abs((b[0]-a[0])*(a[1]-p[1])-(a[0]-p[0])*(b[1]-a[1]))/length
            if distance<smallest:smallest=distance;remove=i
        if remove is None:break
        result.pop(remove)
    return result

def contours(path):
    im=Image.open(path);alpha=im.getchannel('A').load();w,h=im.size
    cells={(x,y) for y in range(math.ceil(h/STEP)) for x in range(math.ceil(w/STEP)) if alpha[min(w-1,x*STEP+2),min(h-1,y*STEP+2)]>=THRESHOLD}
    # Ignore isolated near-transparent export noise; retain the connected artwork.
    remaining=set(cells);largest=set()
    while remaining:
        seed=remaining.pop();component={seed};queue=deque([seed])
        while queue:
            x,y=queue.popleft()
            for neighbor in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if neighbor in remaining:remaining.remove(neighbor);component.add(neighbor);queue.append(neighbor)
        if len(component)>len(largest):largest=component
    edges=defaultdict(list)
    for x,y in largest:
        for outside,a,b in [((x,y-1),(x,y),(x+1,y)),((x+1,y),(x+1,y),(x+1,y+1)),((x,y+1),(x+1,y+1),(x,y+1)),((x-1,y),(x,y+1),(x,y))]:
            if outside not in largest:edges[a].append(b)
    loops=[]
    while edges:
        start=next(iter(edges));p=start;loop=[]
        while True:
            loop.append([p[0]*STEP,p[1]*STEP]);next_point=edges[p].pop()
            if not edges[p]:del edges[p]
            p=next_point
            if p==start:break
        if abs(area(loop))>=160:loops.append(loop)
    loops.sort(key=lambda p:abs(area(p)),reverse=True)
    outer=simplify(loops[0],4);holes=[simplify(p,3) for p in loops[1:] if abs(area(p))>300]
    xs=[p[0] for p in outer];ys=[p[1] for p in outer];bbox=[min(xs),min(ys),max(xs),max(ys)]
    mid=(bbox[0]+bbox[2])/2;column=round(mid/STEP)
    top=min(y for x,y in largest if abs(x-column)<=1)*STEP
    return {'sourceSize':[w,h],'bounds':bbox,'anchor':[mid,top+2], 'outline':outer,'holes':holes,'alphaThreshold':THRESHOLD,'sampleStep':STEP,'sourceSha256':sha256(path.read_bytes()).hexdigest()}

data={}
for key,name in [('normal','envelope.png'),('gold','envelope-star.png')]:
    item=contours(ROOT/'assets/illustrations/wish'/name)
    item.update(file=name,paperPatch=[700,330,170,90],flap=[[326,178],[1302,321],[786,554]] if key=='normal' else [[254,110],[1320,268],[748,532]],seal={'center':[745,590],'radius':129 if key=='normal' else 143})
    data[key]=item
    print(key, 'outline',len(item['outline']),'holes',[len(h) for h in item['holes']],'bounds',item['bounds'],'anchor',item['anchor'])
target=ROOT/'js/data/envelope-shapes.js'
target.write_text('// Generated from original alpha by scripts/build-envelope-shapes.py. PNG pixels are unchanged.\nexport const envelopeShapes = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
