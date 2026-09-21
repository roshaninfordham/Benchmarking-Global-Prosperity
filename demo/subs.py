# Writes narration.md and bgp-demo.srt from the recorded timings (run after assemble.py).
import json
m = json.load(open("marks.json"))["marks"]; sy = json.load(open("sync.json"))
dur = json.load(open("audio/durations.json")); caps = json.load(open("captions.json")); sc = json.load(open("script.json"))
ts = lambda t: f"{int(t//3600):02d}:{int(t%3600//60):02d}:{t%60:06.3f}".replace(".", ",")
srt, md, n = [], ["# Demo narration", "", "Times are from the start of the video.", ""], 1
for ln in sc["lines"]:
    k = ln["id"]; start = m[k] - sy["D"] - sy["OFF"] + 0.12
    md += [f"**{int(start//60)}:{int(start%60):02d}**  {ln['text']}", ""]
    total = sum(len(p) for p in caps[k]); t = start
    for p in caps[k]:
        d = len(p) / total * dur[k]
        if p.strip(): srt.append(f"{n}\n{ts(t)} --> {ts(t+d)}\n{p}\n"); n += 1
        t += d
open("bgp-demo.srt", "w").write("\n".join(srt)); open("narration.md", "w").write("\n".join(md))
print(n - 1, "subtitle cues")
