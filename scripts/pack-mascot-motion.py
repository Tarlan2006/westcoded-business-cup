"""Build local motion patches from the published nine keys (Pillow and NumPy)."""
import io
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

W, H = 320, 496
old = subprocess.check_output(["git", "show", "133e2c5:public/mascot/frames/guide.webp"])
source = Image.open(io.BytesIO(old)).convert("RGBA")
def clean_matte(key):
    # The source cutouts retain pale, partially transparent background around the hair and collar.
    pixels = np.asarray(key, dtype=float).copy()
    alpha = pixels[:, :, 3:] / 255
    pixels[:, :, :3] = np.clip((pixels[:, :, :3] - (1-alpha)*[238, 232, 233]) / np.maximum(alpha, .01), 0, 255)
    pixels[:, :, 3:] = np.clip((alpha*255-162)/86, 0, 1)*255
    return Image.fromarray(np.uint8(np.rint(pixels)))


keys = [clean_matte(source.crop((c*W, r*H, (c+1)*W, (r+1)*H))) for r in range(3) for c in range(3)]
X, Y = np.meshgrid(np.arange(W, dtype=float), np.arange(H, dtype=float))


def smooth(value):
    value = np.clip(value, 0, 1)
    return value*value*(3-2*value)


def warp(image, x, y):
    # Bilinear interpolation in premultiplied alpha avoids pale/black fringes.
    rgba = np.asarray(image.convert("RGBa"), dtype=float)
    x, y = np.clip(x, 0, W-1.001), np.clip(y, 0, H-1.001)
    ix, iy = x.astype(int), y.astype(int)
    fx, fy = (x-ix)[..., None], (y-iy)[..., None]
    values = ((rgba[iy, ix]*(1-fx) + rgba[iy, ix+1]*fx)*(1-fy) +
              (rgba[iy+1, ix]*(1-fx) + rgba[iy+1, ix+1]*fx)*fy)
    return Image.fromarray(np.uint8(np.rint(values)), "RGBa").convert("RGBA")


def mask(array):
    return Image.fromarray(np.uint8(np.rint(np.clip(array, 0, 1)*255)))


def ellipse(cx, cy, rx, ry):
    return np.sqrt(((X-cx)/rx)**2 + ((Y-cy)/ry)**2)


eyes = (116, 98, 197, 131)
eye_mask = mask(smooth((1.25-np.minimum(ellipse(134,115,18,13),
                                         ellipse(179,114,18,13)))/.35))
def lids(key, fraction):
    # Follow each upper lash line. Pin its outer corners and the lower eyelid.
    heights = [(105,104), (115,114), (122,121)]
    shift = np.zeros_like(X)
    for eye, cx in enumerate([134,179]):
        top, bottom = heights[key][eye], heights[key+1][eye]
        line = top + (bottom-top)*fraction
        shift += (bottom-top)*np.exp(-((X-cx)/13)**2-((Y-line)/9)**2)
    return Image.blend(warp(keys[key], X, Y-fraction*shift),
                       warp(keys[key+1], X, Y+(1-fraction)*shift), smooth(fraction))

eye_tiles = [Image.composite(im, keys[0], eye_mask).crop(eyes)
             for im in [keys[0], *(lids(0,f) for f in (.25,.5,.75)), keys[1],
                        *(lids(1,f) for f in (.25,.5,.75)), keys[2]]]

mouth = (154, 127, 205, 158)
mouth_mask = mask(smooth((1.08-ellipse(180,141,24,13))/.26))
# Contract the medium opening toward its smile line to form a small aperture.
line = 142 - .25*(X-179)
field = np.exp(-((X-180)/20)**4-((Y-line)/10)**4)
def aperture(contraction):
    return warp(keys[7], X, Y+(Y-line)*contraction*field)
# Pull both corners inward for a rounded vowel. Only the lip region moves.
radius = ellipse(180,142,24,13)
roundness = smooth((1.12-radius)/.40)
lip_x = np.interp(X, [0,155,165,173,187,197,205,319], [0,155,161,164,194,199,205,319])
arc = np.sqrt(np.maximum(0, 1-((X-180)/8.4)**2))
upper = np.interp(lip_x, [164,170,180,188,194,198], [140,142,140,138,135,132])
lower = np.interp(lip_x, [164,170,180,188,194,198], [140,145,148,147,138,132])
top, bottom = 142-4.8*arc, 142+6*arc
lip_y = np.where(Y<top, upper+Y-top, np.where(Y>bottom, lower+Y-bottom,
                 upper+(Y-top)*(lower-upper)/np.maximum(1,bottom-top)))
def rounded_vowel(amount):
    return warp(keys[8], X+(lip_x-X)*roundness*amount, Y+(lip_y-Y)*roundness*amount)
mouth_tiles = [Image.composite(im, keys[6], mouth_mask).crop(mouth)
               for im in [keys[6], aperture(.85), keys[7], keys[8], rounded_vowel(1),
                          aperture(.42), rounded_vowel(.5)]]

arm = (200, 41, 313, 182)
def wave(angle):
    # Inverse elbow rotation. Pin the sleeve at its seam and leave the face fixed.
    dx, dy = X-214, Y-163
    radius = np.hypot(dx, dy)
    bend = np.deg2rad(angle)*smooth((radius-5)/57)*smooth((181-Y)/27)*smooth((X-200)/16)
    return warp(keys[5], 214+dx*np.cos(bend)+dy*np.sin(bend),
                163-dx*np.sin(bend)+dy*np.cos(bend)).crop(arm)

arm_tiles = [wave(angle) for angle in np.linspace(-30, 0, 15)]

# Three full, stable poses. Rows below contain only the pixels that can change.
atlas = Image.new("RGBA", (960, 1078))
occupied = []


def place(tile, x, y):
    right, bottom = x+tile.width, y+tile.height
    assert right <= atlas.width and bottom <= atlas.height
    assert all(right <= l or r <= x or bottom <= t or b <= y for l,t,r,b in occupied)
    occupied.append((x, y, right, bottom))
    atlas.paste(tile, (x, y))


for col, base in enumerate([keys[0], keys[5], keys[6]]):
    place(base, W*col, 0)
groups = [(eye_tiles, 0, 496, 9), (mouth_tiles, 544, 928, 7), (arm_tiles, 0, 529, 8)]
for tiles, x, y, columns in groups:
    for i, tile in enumerate(tiles):
        place(tile, x+(i%columns)*tile.width, y+(i//columns)*tile.height)
# Rigid head layers pivot at the collar. Keep the lower jacket and eye outlines fixed.
head = (65, 0, 249, 189)
gaze = (110, 96, 202, 135)
for variant, (tilt, look_x, look_y) in enumerate([(3.5, -1.2, 0), (-3, 2.2, -1.8)]):
    turn = np.deg2rad(tilt) * smooth((185-Y)/27)
    dx, dy = X-158, Y-164
    for i, eye in enumerate(eye_tiles):
        layer = keys[0].copy()
        layer.paste(eye, eyes[:2])
        iris = smooth((1-np.minimum(ellipse(134,115,12,10), ellipse(179,114,12,10)))/.44)
        weight = iris*(1-i/(len(eye_tiles)-1))
        shifted = warp(layer, X-look_x*weight, Y-look_y*weight)
        tilted = warp(shifted, 158+dx*np.cos(turn)+dy*np.sin(turn),
                      164-dx*np.sin(turn)+dy*np.cos(turn))
        if i == 0:
            place(tilted.crop(head), variant*184, 811)
        place(tilted.crop(gaze), i*92, 1000+variant*39)
# Reuse the raised sleeve of the current boy on the far shoulder for a two-hand cheer.
# Keep the photographed face, collar, belt buckle and boots from the original key.
cheer = keys[5]
mirrored = warp(cheer, 314-X, Y)
jacket = smooth((145-X)/18)*smooth((359-Y)/18)*smooth((Y-154)/20)
body = Image.composite(mirrored, cheer, mask(jacket))
far_arm = mirrored.copy()
far_arm.putalpha(mask(np.asarray(mirrored.getchannel("A"))/255 *
                      smooth((113-X)/8)*smooth((181-Y)/18)))
cheer = Image.alpha_composite(far_arm, body)
# Store only the changed left side; the happy face and other hand use the wave base.
place(cheer.crop((0,64,153,253)), 368, 811)
place(cheer.crop((0,253,153,361)), 700, 811)
atlas.save("public/mascot/frames/guide.webp", quality=80, method=6)
poster = keys[5].copy()
poster.paste(arm_tiles[0], arm[:2])
poster.save("public/mascot/frames/welcome.webp", quality=78, method=6)

# Enlarge the exact encoded runtime tiles on two backgrounds for visual review.
result = Image.open("public/mascot/frames/guide.webp").convert("RGBA")
# A one-row overlap used to punch a line through the chin in every speaking frame.
for i in range(len(mouth_tiles)):
    x, y = 544+i*51, 928
    row = np.asarray(result)[y+30, x:x+51, 3]
    assert np.array_equal(row, np.asarray(result)[157, 794:845, 3])
out = Path("scripts/.cache/mascot-motion")
out.mkdir(parents=True, exist_ok=True)
for name, (tiles, x, y, columns) in zip(["lids","mouth","arm"],groups):
    width, height = tiles[0].size
    scale = 2 if name == "arm" else 3
    review = Image.new("RGB", (width*len(tiles)*scale, height*scale*2))
    for i in range(len(tiles)):
        left, top = x+(i%columns)*width, y+(i//columns)*height
        tile = result.crop((left,top,left+width,top+height))
        tile = tile.resize((width*scale,height*scale),Image.Resampling.NEAREST)
        for row, bg in enumerate(["#FAF6EF","#231F52"]):
            cell = Image.new("RGB", tile.size, bg)
            cell.paste(tile, mask=tile.getchannel("A"))
            review.paste(cell, (i*tile.width,row*tile.height))
    review.save(out/(name+".png"))
