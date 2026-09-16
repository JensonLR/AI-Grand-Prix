"""Build the shared AGP-01 render asset without external modelling dependencies."""
from __future__ import annotations

import json
import math
import struct
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps/web/public/models/agp01.glb"
GROUPS = {name: {"p": [], "n": [], "i": []} for name in ("Body", "Secondary", "Accent", "Carbon", "Rubber", "Metal", "Visor")}


def add_mesh(group: str, positions, normals, indices):
    target = GROUPS[group]
    offset = len(target["p"])
    target["p"].extend(positions)
    target["n"].extend(normals)
    target["i"].extend(offset + int(i) for i in indices)


def ellipsoid(group, center, radii, rings=14, segments=30):
    p, n, idx = [], [], []
    cx, cy, cz = center
    rx, ry, rz = radii
    for v in range(rings + 1):
        phi = math.pi * v / rings
        for u in range(segments + 1):
            theta = 2 * math.pi * u / segments
            unit = np.array([math.sin(phi) * math.cos(theta), math.cos(phi), math.sin(phi) * math.sin(theta)])
            pos = np.array([cx, cy, cz]) + unit * np.array([rx, ry, rz])
            normal = unit / np.array([rx, ry, rz])
            normal /= np.linalg.norm(normal)
            p.append(pos.tolist()); n.append(normal.tolist())
    for v in range(rings):
        for u in range(segments):
            a = v * (segments + 1) + u; b = a + segments + 1
            idx += [a, b, a + 1, a + 1, b, b + 1]
    add_mesh(group, p, n, idx)


def box(group, center, size, taper=(1, 1)):
    cx, cy, cz = center; sx, sy, sz = size; front, rear = taper
    verts = []
    for z, scale in ((cz - sz / 2, rear), (cz + sz / 2, front)):
        verts += [[cx - sx * scale / 2, cy - sy / 2, z], [cx + sx * scale / 2, cy - sy / 2, z],
                  [cx + sx * scale / 2, cy + sy / 2, z], [cx - sx * scale / 2, cy + sy / 2, z]]
    faces = [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(4,0,3,7)]
    p, n, idx = [], [], []
    for face in faces:
        a,b,c,d = [np.array(verts[i], dtype=float) for i in face]
        normal = np.cross(b-a,c-a); normal /= np.linalg.norm(normal)
        base = len(p); p += [a.tolist(),b.tolist(),c.tolist(),d.tolist()]; n += [normal.tolist()]*4; idx += [base,base+1,base+2,base,base+2,base+3]
    add_mesh(group,p,n,idx)


def cylinder_x(group, center, radius, length, segments=24):
    cx,cy,cz=center; p=[];n=[];idx=[]
    for side,x in enumerate((cx-length/2,cx+length/2)):
        for i in range(segments):
            a=2*math.pi*i/segments; p.append([x,cy+math.cos(a)*radius,cz+math.sin(a)*radius]); n.append([0,math.cos(a),math.sin(a)])
    for i in range(segments):
        j=(i+1)%segments; idx += [i,j,segments+i,j,segments+j,segments+i]
    for side,x in enumerate((cx-length/2,cx+length/2)):
        center_i=len(p); p.append([x,cy,cz]); n.append([-1 if side==0 else 1,0,0])
        ring=[]
        for i in range(segments):
            a=2*math.pi*i/segments; ring.append(len(p));p.append([x,cy+math.cos(a)*radius,cz+math.sin(a)*radius]);n.append(n[center_i])
        for i in range(segments):
            j=(i+1)%segments; idx += [center_i,ring[j],ring[i]] if side==0 else [center_i,ring[i],ring[j]]
    add_mesh(group,p,n,idx)


def strut(group, a, b, radius=.025, segments=10):
    a=np.array(a,float);b=np.array(b,float);axis=b-a;length=np.linalg.norm(axis);axis/=length
    helper=np.array([0,1,0],float) if abs(axis[1])<.9 else np.array([1,0,0],float)
    u=np.cross(axis,helper);u/=np.linalg.norm(u);v=np.cross(axis,u)
    p=[];n=[];idx=[]
    for end in (a,b):
        for i in range(segments):
            ang=2*math.pi*i/segments;normal=u*math.cos(ang)+v*math.sin(ang);p.append((end+normal*radius).tolist());n.append(normal.tolist())
    for i in range(segments):
        j=(i+1)%segments;idx += [i,j,segments+i,j,segments+j,segments+i]
    add_mesh(group,p,n,idx)


# Smooth aerodynamic bodywork.
ellipsoid("Body", (0,.58,.15), (.62,.46,2.35), 18, 36)
ellipsoid("Body", (-.78,.50,-.55), (.50,.32,1.36), 12, 28)
ellipsoid("Body", (.78,.50,-.55), (.50,.32,1.36), 12, 28)
ellipsoid("Body", (0,.88,-1.28), (.43,.55,1.10), 15, 30)
box("Secondary", (0,.44,2.22), (.82,.34,2.9), (.28,1.0))
box("Secondary", (-.78,.73,-.55), (.82,.10,1.95), (.82,1.0))
box("Secondary", (.78,.73,-.55), (.82,.10,1.95), (.82,1.0))
box("Carbon", (0,.18,.05), (2.25,.08,5.9), (.88,1.0))
box("Carbon", (0,.23,3.68), (4.7,.08,.55), (1,1))
box("Accent", (0,.30,3.72), (4.22,.04,.16), (1,1))
box("Carbon", (0,1.19,-2.53), (3.24,.12,.70), (1,1))
box("Accent", (0,1.30,-2.53), (2.80,.045,.72), (1,1))
box("Accent", (0,.91,.22), (.12,.045,4.62), (1,1))
for x in (-1.95,1.95): box("Secondary", (x,.48,3.68), (.12,.58,.58), (1,1))
for x in (-1.4,1.4): box("Carbon", (x,.72,-2.53), (.11,1.08,.18), (1,1))
ellipsoid("Visor", (0,1.03,.06), (.43,.24,.72), 10, 24)
ellipsoid("Accent", (0,1.22,-.08), (.26,.29,.30), 12, 24)

# Wheels, rims and working suspension silhouette.
for x in (-1.43,1.43):
    for z in (-1.72,2.04):
        cylinder_x("Rubber",(x,.48,z),.51,.40,30)
        cylinder_x("Metal",(x,.48,z),.285,.415,24)
        cylinder_x("Accent",(x,.48,z),.105,.43,18)
        strut("Carbon",(x*.38,.50,z-.34),(x,.48,z),.024)
        strut("Carbon",(x*.38,.50,z+.34),(x,.48,z),.024)
        strut("Carbon",(x*.46,.80,z),(x,.48,z),.021)

# Halo and rear diffuser details.
for side in (-1,1):
    strut("Carbon",(0,.98,.58),(side*.56,1.18,.08),.045,12)
    strut("Carbon",(side*.56,1.18,.08),(0,1.18,-.42),.045,12)
for x in (-.72,-.36,0,.36,.72): box("Carbon",(x,.26,-2.78),(.07,.36,.8),(.4,1))


def align4(blob: bytearray):
    while len(blob)%4: blob.append(0)


materials=[]
palette={"Body":"#234cbd","Secondary":"#f2e8d1","Accent":"#d7a647","Carbon":"#080b0e","Rubber":"#020304","Metal":"#9da5aa","Visor":"#07131e"}
for name,color in palette.items():
    rgb=tuple(int(color[i:i+2],16)/255 for i in (1,3,5))
    materials.append({"name":name,"pbrMetallicRoughness":{"baseColorFactor":[*rgb,1],"metallicFactor":.72 if name in ("Carbon","Metal") else .32,"roughnessFactor":.18 if name in ("Body","Secondary","Accent","Visor") else .5}})

blob=bytearray();views=[];accessors=[];primitives=[]
for material_index,(name,data) in enumerate(GROUPS.items()):
    pos=np.asarray(data["p"],dtype=np.float32);norm=np.asarray(data["n"],dtype=np.float32);ind=np.asarray(data["i"],dtype=np.uint32)
    attrs={}
    for semantic,array,component,kind in (("POSITION",pos,5126,"VEC3"),("NORMAL",norm,5126,"VEC3")):
        align4(blob);offset=len(blob);raw=array.tobytes();blob.extend(raw);views.append({"buffer":0,"byteOffset":offset,"byteLength":len(raw),"target":34962});view=len(views)-1
        acc={"bufferView":view,"componentType":component,"count":len(array),"type":kind}
        if semantic=="POSITION":acc.update({"min":array.min(axis=0).tolist(),"max":array.max(axis=0).tolist()})
        accessors.append(acc);attrs[semantic]=len(accessors)-1
    align4(blob);offset=len(blob);raw=ind.tobytes();blob.extend(raw);views.append({"buffer":0,"byteOffset":offset,"byteLength":len(raw),"target":34963});accessors.append({"bufferView":len(views)-1,"componentType":5125,"count":len(ind),"type":"SCALAR"})
    primitives.append({"attributes":attrs,"indices":len(accessors)-1,"material":material_index,"mode":4})

doc={"asset":{"version":"2.0","generator":"AI Grand Prix AGP-01 Builder"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"name":"AGP-01","mesh":0}],"meshes":[{"name":"AGP-01","primitives":primitives}],"materials":materials,"buffers":[{"byteLength":len(blob)}],"bufferViews":views,"accessors":accessors}
json_bytes=json.dumps(doc,separators=(",",":")).encode();json_bytes+=b" "*((4-len(json_bytes)%4)%4);align4(blob)
total=12+8+len(json_bytes)+8+len(blob);OUT.parent.mkdir(parents=True,exist_ok=True)
with OUT.open("wb") as f:
    f.write(struct.pack("<4sII",b"glTF",2,total));f.write(struct.pack("<I4s",len(json_bytes),b"JSON"));f.write(json_bytes);f.write(struct.pack("<I4s",len(blob),b"BIN\0"));f.write(blob)
print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes)")
