"""Check visible movement in a Playwright film and export the verified 60 seconds."""
import json
import os
import subprocess
from pathlib import Path
import cv2
import numpy as np

cache = Path("scripts/.cache/mascot-emotions")
out = Path("docs/mascot/emotions")
data = json.loads((cache/"recording.json").read_text("utf8"))
video = cv2.VideoCapture(str(cache/"panel.webm"))
fps = video.get(cv2.CAP_PROP_FPS)
box = data["rect"]
x,y,w,h = (round(box[k]) for k in ["x","y","width","height"])
anchor = None
mark = None
last_change = longest = 0
measurements = []
for number in range(round(video.get(cv2.CAP_PROP_FRAME_COUNT))):
    ok, image = video.read()
    if not ok: break
    if mark is None:
        b,g,r = (int(v) for v in image[4,4])
        if g>160 and g-r>100 and g-b>100: mark=number
        else: continue
    elapsed = (number-mark)/fps
    if elapsed>60: break
    if (number-mark)%2: continue
    roi=cv2.cvtColor(image[y:y+h,x:x+w],cv2.COLOR_BGR2GRAY)
    roi=cv2.GaussianBlur(cv2.resize(roi,(w//2,h//2),interpolation=cv2.INTER_AREA),(3,3),0)
    if anchor is None: anchor=roi.copy()
    changed=int((cv2.absdiff(roi,anchor)>=6).sum())
    gap=elapsed-last_change
    longest=max(longest,gap)
    if changed>=90:
        last_change=elapsed
        anchor=roi.copy()
    measurements.append(f"{elapsed:.3f},{changed},{gap:.3f}")
video.release()
assert not data["errors"],data["errors"]
assert mark is not None and elapsed>=60
assert longest<1.5, f"Visible freeze {longest:.3f}s"
(out/"motion-pixels.csv").write_text("seconds,changed_pixels,gap_seconds\n"+"\n".join(measurements)+"\n")
(out/"measurement.json").write_text(json.dumps(dict(fps=fps,seconds=60,maxGapSeconds=round(longest,3),
    pixelThreshold=6,minChangedPixels=90,analysisScale=0.5,region=box,samples=len(measurements),consoleErrors=data["errors"]),indent=2)+"\n")
# A screenshot film has no microphone track. Align the two actual local MP3s to Web Audio starts.
ffmpeg=os.environ["FFMPEG"]
clips=json.loads(Path("public/audio/kk/manifest.json").read_text())["clips"]
starts=data["soundStarts"]
assert len(starts)==2,starts
args=[ffmpeg,"-loglevel","error","-y","-ss",str(mark/fps),"-i",str(cache/"panel.webm")]
for key in ["common_quiz_encourage","common_setup_greeting"]: args+=["-i","public"+clips[key]]
# Wrong is interrupted by the speaking button; cut its audio at that instant too.
filters=f"[1:a]atrim=duration={starts[1]-starts[0]:.3f},adelay={round(starts[0]*1000)}:all=1[a];[2:a]adelay={round(starts[1]*1000)}:all=1[b];[a][b]amix=inputs=2:normalize=0[audio]"
subprocess.run(args+["-filter_complex",filters,"-map","0:v","-map","[audio]","-t","60","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-movflags","+faststart",str(out/"emotions-60s.mp4")],check=True)
subprocess.run([ffmpeg,"-loglevel","error","-y","-ss","31","-t","18","-i",str(out/"emotions-60s.mp4"),"-vf",f"crop={w}:{h}:{x}:{y},fps=15,scale=-2:240","-an","-c:v","libwebp_anim","-quality","78","-loop","0",str(out/"emotions.webp")],check=True)
print("PASS visible motion for 60 s; longest interval",round(longest,3),"s")
