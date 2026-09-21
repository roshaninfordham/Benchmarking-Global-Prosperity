import json, subprocess
d = json.load(open("marks.json")); m = d["marks"]; V = d["video"]
dur = json.load(open("audio/durations.json"))
OFF = 0.55                      # skip the blank frames before the title card
end = m["end"] - OFF
ids = [f"l{i}" for i in range(1, 14)]
inputs, filt, mix = [], [], []
for i, k in enumerate(ids):
    inputs += ["-i", f"audio/{k}.wav"]
    ms = int(round((m[k] - OFF + 0.12) * 1000))
    filt.append(f"[{i+1}:a]adelay={ms}|{ms},aresample=48000[a{i}]")
    mix.append(f"[a{i}]")
filt.append("".join(mix) + f"amix=inputs={len(ids)}:normalize=0,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=9,apad,atrim=0:{end:.2f}[aout]")
filt.append(f"[0:v]trim=start={OFF}:end={m['end']},setpts=PTS-STARTPTS,fps=30,fade=t=in:st=0:d=0.4,fade=t=out:st={end-0.9:.2f}:d=0.9,format=yuv420p[vout]")
cmd = ["ffmpeg", "-v", "error", "-y", "-i", V, *inputs, "-filter_complex", ";".join(filt), "-map", "[vout]", "-map", "[aout]",
       "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{end:.2f}", "bgp-demo.mp4"]
subprocess.run(cmd, check=True)
print("built, target length", round(end, 1), "s")
