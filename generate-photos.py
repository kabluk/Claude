#!/usr/bin/env python3
"""
generate-photos.py — Generate all Nude Love website photos via Kie.ai Flux Kontext API.

Usage:
  python generate-photos.py                  # generate images only
  python generate-photos.py --patch          # generate + patch index.html <img> tags
  python generate-photos.py --patch --only hero philosophy  # subset by file stem
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

# ── Config ────────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("KIE_API_KEY", "1b2daf2ba5ae1beb03ff1ee48375917d")
BASE_URL = "https://api.kie.ai/api/v1/flux/kontext"
GENERATE_URL = f"{BASE_URL}/generate"
POLL_URL = f"{BASE_URL}/record-info"
OUTPUT_DIR = Path("images")
INDEX_FILE = Path("index.html")
POLL_INTERVAL = 5   # seconds between status checks
POLL_TIMEOUT = 300  # seconds before giving up on a single task

STYLE_BLOCK = (
    "Deep midnight navy blue and rose gold editorial photography, "
    "candlelit sacred-ceremony atmosphere, an intimate community of adult men and women together, "
    "warm copper reflections against deep blue shadows, silk fabrics, shallow depth of field, "
    "shot on 35mm film, mysterious reverent and tender, luxury magazine aesthetic, "
    "tasteful and non-explicit, no text, no logos, no pure black. All adults."
)

NEGATIVE_PROMPT = (
    "text, watermark, logo, explicit nudity, sexual content, pornographic, child, minor, teenager, "
    "distorted hands, extra fingers, plastic skin, harsh flash, green tones, daylight white balance, clutter"
)

# ── Image definitions ─────────────────────────────────────────────────────────
IMAGES = [
    {
        "file": "hero.jpg",
        "aspect": "16:9",
        "placeholder_cap": "Photo — hero background",
        "prompt": (
            "Sacred candlelit ceremony: a circle of adult men and women seated around hundreds of candles "
            "and a central flame, shot from behind one participant, rose-gold light on calm faces, "
            "deep navy shadows, intimate secret gathering. " + STYLE_BLOCK
        ),
    },
    {
        "file": "philosophy.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Photo — candlelit practice space",
        "prompt": (
            "A man and a woman facing each other in candlelight, foreheads almost touching, "
            "hands connected, seen partly from behind, tender sacred intimacy. " + STYLE_BLOCK
        ),
    },
    {
        "file": "card-classes.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Photo — evening classes card",
        "prompt": (
            "Small candlelit circle of adult men and women in evening practice, seen from behind a participant, "
            "belonging to a close secret community, darker bottom vignette. " + STYLE_BLOCK
        ),
    },
    {
        "file": "card-retreat.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Photo — retreat card",
        "prompt": (
            "Group of adult men and women by candlelight on a terrace at blue hour, "
            "around a central fire, intimate retreat gathering, darker lower third. " + STYLE_BLOCK
        ),
    },
    {
        "file": "class-art.jpg",
        "aspect": "3:4",
        "placeholder_cap": "Art therapy",
        "prompt": (
            "Adult men and women painting together by candlelight around a low table, "
            "rose-gold strokes on canvas, communal art therapy, quiet intimacy. " + STYLE_BLOCK
        ),
    },
    {
        "file": "class-circle.jpg",
        "aspect": "3:4",
        "placeholder_cap": "Evening circle",
        "prompt": (
            "Circle of adult men and women seated close on cushions, seen from just behind, "
            "one pair's hands touching, atmosphere of trust and closeness. " + STYLE_BLOCK
        ),
    },
    {
        "file": "class-space.jpg",
        "aspect": "16:10",
        "placeholder_cap": "The space at dusk",
        "prompt": (
            "Candlelit hall prepared for ceremony: cushions arranged in a circle, hundreds of candles, "
            "silhouettes of adult men and women entering, expectant sacred mood. " + STYLE_BLOCK
        ),
    },
    {
        "file": "retreat-location.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Retreat location",
        "prompt": (
            "Secluded villa at blue hour, silhouettes of a couple standing close on the terrace "
            "over dark calm water, atmosphere of sanctuary and deep intimacy. " + STYLE_BLOCK
        ),
    },
    {
        "file": "retreat-after.jpg",
        "aspect": "16:10",
        "placeholder_cap": "Life after retreat",
        "prompt": (
            "A man and a woman standing close in candlelight against blue twilight, seen partly from behind, "
            "her head toward his shoulder, deeply connected and at peace. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g1-sunset.jpg",
        "aspect": "16:10",
        "placeholder_cap": "Sunset practice",
        "prompt": (
            "Silhouettes of adult men and women in gentle partnered movement against indigo-copper twilight "
            "over water, connection and trust, arms reaching toward each other. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g2-candle.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Candle ritual",
        "prompt": (
            "Circle of adult men and women around a large arrangement of candles seen slightly from above, "
            "sacred ceremony, calm faces turned toward the light. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g3-morning.jpg",
        "aspect": "1:1",
        "placeholder_cap": "Morning light",
        "prompt": (
            "A couple resting close under warm light through sheer curtains at dusk, "
            "tender intimacy, seen from behind, fully clothed in soft fabrics. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g4-art.jpg",
        "aspect": "1:1",
        "placeholder_cap": "Art session",
        "prompt": (
            "Hands of a man and a woman painting on one shared canvas by candlelight, "
            "fingers almost touching, shared creative intimacy, rose-gold strokes. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g5-table.jpg",
        "aspect": "1:1",
        "placeholder_cap": "The table",
        "prompt": (
            "Long candlelit community dinner: adult men and women around a table, "
            "hands reaching and connecting across dishes, joyful sacred gathering. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g6-water.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Water & gold",
        "prompt": (
            "Silhouettes of a man and a woman at the edge of dark water at dusk, "
            "copper light reflected on the water, seen from behind, meditative and close. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g7-circle.jpg",
        "aspect": "16:10",
        "placeholder_cap": "Evening circle",
        "prompt": (
            "Wide candlelit ceremony: adult men and women in a full circle around dozens of flames "
            "and a central fire, secret community, deep bronze shadows at the edges. " + STYLE_BLOCK
        ),
    },
    {
        "file": "blog-body.jpg",
        "aspect": "4:3",
        "placeholder_cap": "Journal — body memory",
        "prompt": (
            "A man and a woman seen from behind in candlelight, her hand resting on his shoulder, "
            "tender study of connection and trust, tasteful and respectful. " + STYLE_BLOCK
        ),
    },
    {
        "file": "blog-patterns.jpg",
        "aspect": "4:3",
        "placeholder_cap": "Journal — patterns",
        "prompt": (
            "A man and a woman facing each other, their images reflected repeatedly in a dark antique mirror, "
            "symbolic of relationship patterns, warm candlelight, moody and intimate. " + STYLE_BLOCK
        ),
    },
    {
        "file": "blog-art.jpg",
        "aspect": "4:3",
        "placeholder_cap": "Journal — art therapy",
        "prompt": (
            "Hands of a man and a woman meeting over a shared canvas with a first rose-gold brushstroke, "
            "candle flame blurred behind, symbolizing the courage to connect. " + STYLE_BLOCK
        ),
    },
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


_ASPECT_MAP = {
    "4:5": "3:4",
    "5:4": "4:3",
    "16:10": "16:9",
    "3:2": "4:3",
    "2:3": "3:4",
}


def submit_task(img: dict) -> str | None:
    """Submit a generation request; return taskId or None on error."""
    aspect = _ASPECT_MAP.get(img["aspect"], img["aspect"])
    payload = {
        "prompt": img["prompt"],
        "aspectRatio": aspect,
        "outputFormat": "jpeg",
        "model": "flux-kontext-pro",
        "enableTranslation": False,
        "inputImageUrl": "https://placehold.co/512x512/1a1a2e/1a1a2e.jpg",
        "promptUpsampling": False,
    }
    try:
        r = requests.post(GENERATE_URL, headers=headers(), json=payload, timeout=30)
        data = r.json()
    except Exception as exc:
        print(f"  [submit error] {exc}")
        return None

    if data.get("code") != 200:
        print(f"  [API error] {data.get('msg', data)}")
        return None

    task_id = data.get("data", {}).get("taskId")
    print(f"  taskId: {task_id}")
    return task_id


def poll_task(task_id: str) -> str | None:
    """Poll until done; return result image URL or None on failure/timeout."""
    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        try:
            r = requests.get(
                POLL_URL, headers=headers(), params={"taskId": task_id}, timeout=30
            )
            data = r.json()
        except Exception as exc:
            print(f"  [poll error] {exc}")
            continue

        if data.get("code") != 200:
            print(f"  [poll API error] {data.get('msg', data)}")
            return None

        record = data.get("data", {})
        success = record.get("successFlag")
        complete = record.get("completeTime")

        if success == 1:
            url = (record.get("response") or {}).get("resultImageUrl")
            return url
        elif success == 0 and complete:
            # completeTime set + successFlag=0 → real failure
            err = record.get("errorMessage") or record.get("errorCode", "unknown")
            print(f"  [failed] {err}")
            return None
        # successFlag=0 without completeTime → still processing
        print(f"  … waiting (taskId={task_id})")

    print(f"  [timeout] {task_id}")
    return None


def download(url: str, dest: Path) -> bool:
    """Download image to dest. Return True on success."""
    import subprocess
    try:
        result = subprocess.run(
            ["curl", "-sS", "--noproxy", "*", "-L", "--max-time", "60", "-o", str(dest), url],
            capture_output=True, timeout=70,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.decode()[:200])
        if dest.stat().st_size < 1000:
            dest.unlink(missing_ok=True)
            raise RuntimeError("downloaded file too small")
        return True
    except Exception as exc:
        print(f"  [download error] {exc}")
        return False


def patch_html(img: dict, img_path: Path):
    """Replace the matching .ph placeholder in index.html with an <img> tag."""
    if not INDEX_FILE.exists():
        print(f"  [patch] {INDEX_FILE} not found — skipping")
        return

    html = INDEX_FILE.read_text(encoding="utf-8")
    cap = img["placeholder_cap"]

    # Match: <div class="ph[...]"><span class="cap">CAPTION</span></div>
    pattern = (
        r'(<div\s[^>]*class="[^"]*\bph\b[^"]*"[^>]*>)'
        r'(\s*<span\s[^>]*class="cap"[^>]*>)'
        + re.escape(cap)
        + r'(</span>\s*</div>)'
    )
    rel_path = f"images/{img_path.name}"
    replacement = (
        f'<div class="ph-img">'
        f'<img src="{rel_path}" alt="{cap}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">'
        f'</div>'
    )

    new_html, n = re.subn(pattern, replacement, html, flags=re.DOTALL)
    if n:
        INDEX_FILE.write_text(new_html, encoding="utf-8")
        print(f"  [patch] replaced placeholder for '{cap}' → {rel_path}")
    else:
        print(f"  [patch] no placeholder found for caption '{cap}'")


def softened_prompt(img: dict) -> dict:
    """Return a copy of img with a safer prompt for content-filtered cases."""
    soft = img.copy()
    # Remove potentially flagged phrases
    p = soft["prompt"]
    replacements = [
        ("A woman's back and shoulders", "Hands resting on a wooden surface"),
        ("silk slipping off one shoulder", "soft warm textile beside her"),
        ("her own hand resting gently on her neck", "a candle glowing nearby"),
        ("fine art study of the body holding and releasing tension",
         "fine art study of stillness and gentle light"),
        ("sculptural cream candle in the shape of a female torso",
         "sculptural abstract cream candle, organic curved form"),
    ]
    for old, new in replacements:
        p = p.replace(old, new)
    soft["prompt"] = p
    soft["_softened"] = True
    return soft


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate Nude Love photos via Kie.ai")
    parser.add_argument("--patch", action="store_true", help="Patch index.html after download")
    parser.add_argument("--only", nargs="*", help="Process only these file stems (without .jpg)")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(exist_ok=True)

    queue = IMAGES
    if args.only:
        stems = set(args.only)
        queue = [i for i in IMAGES if Path(i["file"]).stem in stems]
        if not queue:
            sys.exit(f"No images matched --only {args.only}")

    total = len(queue)
    ok = 0

    for idx, img in enumerate(queue, 1):
        dest = OUTPUT_DIR / img["file"]
        print(f"\n[{idx}/{total}] {img['file']} ({img['aspect']})")

        if dest.exists():
            print(f"  already exists — skipping generation")
            if args.patch:
                patch_html(img, dest)
            ok += 1
            continue

        # Try original prompt; if it fails due to content filter, soften once
        for attempt, current in enumerate([img, softened_prompt(img)], 1):
            if attempt == 2:
                print(f"  retrying with softened prompt …")

            task_id = submit_task(current)
            if not task_id:
                continue

            url = poll_task(task_id)
            if url:
                if download(url, dest):
                    print(f"  ✓ saved → {dest}")
                    if args.patch:
                        patch_html(img, dest)
                    ok += 1
                    break
            # content filter or hard failure → try softened on next loop iteration
        else:
            print(f"  ✗ failed after all attempts — skipping")

    print(f"\nDone: {ok}/{total} images generated.")
    if args.patch and ok:
        print(f"index.html patched.")


if __name__ == "__main__":
    main()
