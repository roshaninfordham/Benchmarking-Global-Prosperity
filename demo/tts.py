import json, sys, numpy as np, soundfile as sf
from kokoro import KPipeline
sc = json.load(open("script.json")); p = KPipeline(lang_code="a")
man = {}
for ln in sc["lines"]:
    chunks = [a for _, _, a in p(ln["text"], voice=sc["voice"], speed=ln["speed"])]
    a = np.concatenate([np.asarray(c) for c in chunks])
    sf.write(f"audio/{ln['id']}.wav", a, 24000)
    man[ln["id"]] = round(len(a) / 24000, 2)
    print(ln["id"], man[ln["id"]], "s", len(ln["text"].split()), "words")
json.dump(man, open("audio/durations.json", "w"))
print("total speech", round(sum(man.values()), 1), "s")
