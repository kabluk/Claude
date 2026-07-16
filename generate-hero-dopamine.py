#!/usr/bin/env python3
"""
Nude Love — "Dopamine" editorial portraits.
Elegant woman seen from behind in a backless dress, dramatic light beam, gold.
Tasteful fashion editorial, clothed, non-explicit, adults only.

Replaces 5 slots on the site with these shots. Keeps the ceremony/circle photos.

Choose palette below, then:
  export KIE_API_KEY="your_key"
  python3 generate-hero-dopamine.py            # generate the 5 (skips existing)
  python3 generate-hero-dopamine.py --force    # overwrite the 5

To compare palettes: set PALETTE="navy", run --force, look at the site;
then set PALETTE="warm", run --force again, compare.
"""

import os, sys, time, json, urllib.request, pathlib, subprocess

API_KEY = os.environ.get("KIE_API_KEY", "")
MODEL   = os.environ.get("KIE_MODEL", "google/nano-banana")

# ============ CHOOSE PALETTE HERE ============
PALETTE = os.environ.get("PALETTE", "navy")   # "navy"  or  "warm"
# =============================================

PALETTES = {
 "navy": ("deep midnight navy blue and rose gold palette, a cool blue-shadowed room with a single "
          "warm copper-gold beam of light, rose-gold accents"),
 "warm": ("dark charcoal and warm gold palette, a shadowy room with a single dramatic warm golden "
          "beam of light, bronze and amber tones (like a moody perfume campaign)"),
}
PAL = PALETTES[PALETTE]

STYLE = (f"{PAL}. Fine-art fashion editorial photography, shot on 35mm film, shallow depth of field, "
         "elegant, sensual yet tasteful, mysterious and quiet, luxury magazine aesthetic, "
         "no text, no logos, no pure black. One adult woman, fully clothed in an elegant dress, non-explicit.")

CREATE_URL = "https://api.kie.ai/api/v1/jobs/createTask"
STATUS_URL = "https://api.kie.ai/api/v1/jobs/recordInfo?taskId={task_id}"
OUT_DIR = pathlib.Path("images")
POLL_EVERY, POLL_MAX = 5, 60

# (filename, aspect_ratio, prompt)
PHOTOS = [
 ("hero.jpg", "16:9",
  "An elegant woman seen from behind in a flowing backless silk gown, bare shoulders and open back, "
  "standing in a soft dramatic beam of light, delicate gold jewelry catching the glow, sheer fabric "
  "draping, calm and poised, cinematic wide composition with space around her."),
 ("philosophy.jpg", "4:5",
  "An elegant woman from behind in a backless dress, one hand lightly touching her bare shoulder, "
  "soft beam of light across her back, gold jewelry, quiet sensual poise, deep shadows around her."),
 ("retreat-after.jpg", "16:10",
  "An elegant woman in a backless silk gown seen from behind, looking gently over her shoulder into "
  "the light, radiant and self-possessed, delicate gold earrings, soft haze, waist-up composition."),
 ("g6-water.jpg", "4:5",
  "Silhouette of an elegant woman from behind in a long open-back dress, standing before a soft column "
  "of light, sheer fabric and gold thread shimmering, meditative and mysterious."),
 ("blog-body.jpg", "4:3",
  "A fine-art study of an elegant woman's bare back and shoulders framed by an open-back dress, "
  "silk slipping softly, a beam of light tracing her spine, gold jewelry, tasteful and poised."),
]

def api(url, payload=None):
    req = urllib.request.Request(url,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        method="POST" if payload else "GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def generate(fname, ratio, prompt):
    out = OUT_DIR / fname
    if out.exists() and "--force" not in sys.argv:
        print(f"  ✓ {fname} exists, skip"); return True
    r = api(CREATE_URL, {"model": MODEL, "input": {"prompt": f"{prompt} {STYLE}", "aspect_ratio": ratio, "output_format": "jpeg"}})
    task_id = (r.get("data") or {}).get("taskId") or r.get("taskId")
    if not task_id:
        print(f"  ✗ {fname}: createTask failed -> {r}"); return False
    print(f"  … {fname} [{PALETTE}] {task_id}", end="", flush=True)
    for _ in range(POLL_MAX):
        time.sleep(POLL_EVERY)
        d = (api(STATUS_URL.format(task_id=task_id)) or {}).get("data") or {}
        state = (d.get("state") or d.get("status") or "").lower()
        if state in ("success","completed","succeeded"):
            res = d.get("resultJson") or d.get("result") or {}
            if isinstance(res, str): res = json.loads(res)
            urls = res.get("resultUrls") or res.get("urls") or res.get("images") or []
            if not urls: print(f"\n  ✗ {fname}: no urls -> {d}"); return False
            res2 = subprocess.run(["curl", "-sS", "--noproxy", "*", "-L", "--max-time", "60", "-o", str(out), urls[0]], capture_output=True, timeout=70)
            if res2.returncode != 0 or out.stat().st_size < 1000:
                out.unlink(missing_ok=True); print(f"\n  ✗ {fname}: download failed"); return False
            print(f" -> saved"); return True
        if state in ("fail","failed","error"):
            print(f"\n  ✗ {fname}: {d.get('failMsg') or d}  (try softening wording if content-blocked)"); return False
        print(".", end="", flush=True)
    print(f"\n  ✗ {fname}: timeout"); return False

if __name__ == "__main__":
    if not API_KEY: sys.exit("Set KIE_API_KEY first: export KIE_API_KEY=...")
    if PALETTE not in PALETTES: sys.exit("PALETTE must be 'navy' or 'warm'")
    OUT_DIR.mkdir(exist_ok=True)
    print(f"Palette: {PALETTE}")
    ok = sum(generate(f, r, p) for f, r, p in PHOTOS)
    print(f"\nDone: {ok}/{len(PHOTOS)}. Re-embed into the site after this.")
