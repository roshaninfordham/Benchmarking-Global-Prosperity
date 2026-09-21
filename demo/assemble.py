import json, subprocess
d = json.load(open("marks.json")); m = d["marks"]; V = d["video"]
dur = json.load(open("audio/durations.json"))
import re
# Find the white sync flash in the raw video: it happened at real time m["flash"], so video time = real time - d.
out = subprocess.run(["ffmpeg", "-v", "error", "-t", "8", "-i", V, "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-"], capture_output=True, text=True).stdout
pts = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", out)]; yavg = [float(x) for x in re.findall(r"lavfi.signalstats.YAVG=([0-9.]+)", out)]
# The clip opens on blank white frames, then the dark title card, then the flash: take the first bright frame after a dark one.
dark = False; vflash = None
for t, y in zip(pts, yavg):
    if y < 80: dark = True
    elif y > 150 and dark: vflash = t; break
D = m["flash"] - vflash          # how far the video clock runs behind the script clock
OFF = vflash + 0.32              # cut just after the flash
print(f"flash seen at video {vflash:.2f}s, scripted {m['flash']:.2f}s, offset {D:+.2f}s")
json.dump({"D": D, "OFF": OFF}, open("sync.json", "w"))
end = m["end"] - D - OFF
ids = [f"l{i}" for i in range(1, 14)]
inputs, filt, mix = [], [], []
for i, k in enumerate(ids):
    inputs += ["-i", f"audio/{k}.wav"]
    ms = int(round((m[k] - D - OFF + 0.12) * 1000))
    filt.append(f"[{i+1}:a]adelay={ms}|{ms},aresample=48000[a{i}]")
    mix.append(f"[a{i}]")
filt.append("".join(mix) + f"amix=inputs={len(ids)}:normalize=0,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=9,apad,atrim=0:{end:.2f}[aout]")
filt.append(f"[0:v]trim=start={OFF}:end={m['end'] - D},setpts=PTS-STARTPTS,fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st={end-0.9:.2f}:d=0.9,format=yuv420p[vout]")
cmd = ["ffmpeg", "-v", "error", "-y", "-i", V, *inputs, "-filter_complex", ";".join(filt), "-map", "[vout]", "-map", "[aout]",
       "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{end:.2f}", "bgp-demo.mp4"]
subprocess.run(cmd, check=True)
print("built, target length", round(end, 1), "s")
