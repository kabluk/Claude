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
    "candlelight glow with warm copper reflections against dark blue shadows, "
    "silk textures, shallow depth of field, shot on 35mm film, "
    "luxury wellness magazine aesthetic, no text, no logos, "
    "rich blue-hour atmosphere, metallic rose-gold highlights, no pure black."
)

NEGATIVE_PROMPT = (
    "text, watermark, logo, harsh flash lighting, plastic skin, distorted hands, "
    "extra fingers, oversaturated colors, clutter, modern office, fluorescent light, "
    "green tones, daylight white balance"
)

# ── Image definitions ─────────────────────────────────────────────────────────
IMAGES = [
    {
        "file": "hero.jpg",
        "aspect": "16:9",
        "placeholder_cap": "Photo — hero background",
        "prompt": (
            "A vast serene evening scene: dozens of lit candles on a dark reflective floor "
            "leading toward floor-to-ceiling windows with a warm sunset sky, sheer silk curtains "
            "moving gently, empty meditation cushions arranged in a circle, cinematic wide shot, "
            "atmosphere of anticipation and calm. " + STYLE_BLOCK
        ),
    },
    {
        "file": "philosophy.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Photo — candlelit practice space",
        "prompt": (
            "An intimate candlelit practice room: warm wooden floor, a circle of cream floor cushions, "
            "a single sculptural candle burning in the center, soft golden light pooling on the walls, "
            "silk throw draped over a low bench, quiet and inviting, nobody present. " + STYLE_BLOCK
        ),
    },
    {
        "file": "card-classes.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Photo — evening classes card",
        "prompt": (
            "Close-up of hands painting with gold and amber watercolors on textured paper by candlelight, "
            "brushstrokes glowing, a glass of herbal tea beside, warm bokeh in background, "
            "sense of gentle creative focus, darker vignette at the bottom of frame. " + STYLE_BLOCK
        ),
    },
    {
        "file": "card-retreat.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Photo — retreat card",
        "prompt": (
            "A luxurious retreat villa terrace at dusk: low daybeds with linen cushions, "
            "lanterns and candles glowing, view over calm water reflecting the last golden light, "
            "sheer curtains, no people, deep warm shadows in the lower third of the frame. " + STYLE_BLOCK
        ),
    },
    {
        "file": "class-art.jpg",
        "aspect": "3:4",
        "placeholder_cap": "Art therapy",
        "prompt": (
            "Overhead shot of an art therapy table: warm-toned paints, brushes, torn textured paper "
            "with abstract golden strokes, a burning candle, dried flowers, hands of a woman "
            "mid-brushstroke entering frame from the side, soft window light mixed with candle glow. " + STYLE_BLOCK
        ),
    },
    {
        "file": "class-circle.jpg",
        "aspect": "3:4",
        "placeholder_cap": "Evening circle",
        "prompt": (
            "A small circle of people seated on cushions in soft candlelight, faces gently blurred "
            "and anonymous, warm light on shoulders and hands, one person speaking with open palms, "
            "atmosphere of trust and deep listening, shot from just outside the circle. " + STYLE_BLOCK
        ),
    },
    {
        "file": "class-space.jpg",
        "aspect": "16:10",
        "placeholder_cap": "The space at dusk",
        "prompt": (
            "Wide shot of an elegant studio at dusk: tall windows with city lights far below, "
            "silk curtains, candles along the windowsill, empty cushions in a semicircle, "
            "reflections on a polished dark floor, warm and expectant mood. " + STYLE_BLOCK
        ),
    },
    {
        "file": "retreat-location.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Retreat location",
        "prompt": (
            "A secluded modern villa in nature at golden hour: warm stone and glass architecture, "
            "infinity-edge water feature reflecting amber sky, cypress or olive trees, "
            "lanterns beginning to glow, sense of privacy and sanctuary, no people. " + STYLE_BLOCK
        ),
    },
    {
        "file": "retreat-after.jpg",
        "aspect": "16:10",
        "placeholder_cap": "Life after retreat",
        "prompt": (
            "A radiant woman in flowing champagne silk standing in golden evening light, "
            "eyes closed, gentle confident smile, hand resting over her heart, hair moving in a soft breeze, "
            "warm sun flare, embodiment of peace and self-worth, waist-up portrait. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g1-sunset.jpg",
        "aspect": "16:10",
        "placeholder_cap": "Sunset practice",
        "prompt": (
            "Silhouettes of a small group in gentle movement practice on a terrace against a molten "
            "golden sunset over water, arms lifted, warm haze, deep amber sky. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g2-candle.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Candle ritual",
        "prompt": (
            "A sculptural cream candle in an elegant hourglass form burning softly, wax gently melting, "
            "dark warm background, single dramatic light source, fine art still life. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g3-morning.jpg",
        "aspect": "1:1",
        "placeholder_cap": "Morning light",
        "prompt": (
            "First morning light streaming through sheer curtains onto an unmade linen bed "
            "in warm ivory tones, steam rising from a ceramic cup on the windowsill, peaceful awakening. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g4-art.jpg",
        "aspect": "1:1",
        "placeholder_cap": "Art session",
        "prompt": (
            "Close crop of a canvas with expressive abstract strokes in bronze, gold and cream, "
            "a hand holding a brush loaded with gold paint, candle flame blurred in the foreground. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g5-table.jpg",
        "aspect": "1:1",
        "placeholder_cap": "The table",
        "prompt": (
            "A long candlelit dinner table set for a retreat group: ceramic plates, golden glasses, "
            "dried botanicals, warm bread and colorful nourishing dishes, hands reaching and passing food, "
            "joyful intimate atmosphere, shallow focus. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g6-water.jpg",
        "aspect": "4:5",
        "placeholder_cap": "Water & gold",
        "prompt": (
            "Golden sunlight scattering across dark rippling water at dusk, thousands of amber sparkles, "
            "abstract and meditative, close-up of the water surface only. " + STYLE_BLOCK
        ),
    },
    {
        "file": "g7-circle.jpg",
        "aspect": "16:10",
        "placeholder_cap": "Evening circle",
        "prompt": (
            "Wide shot of a candlelit evening ceremony: people seated in a circle around dozens of small flames, "
            "warm light on relaxed faces turned toward the center, "
            "deep bronze shadows around the edges of the room. " + STYLE_BLOCK
        ),
    },
    {
        "file": "blog-body.jpg",
        "aspect": "4:3",
        "placeholder_cap": "Journal — body memory",
        "prompt": (
            "A woman's back and shoulders in soft warm light, silk fabric draped over one shoulder, "
            "her own hand resting gently on her neck, sculptural shadows, intimate and respectful, "
            "fine art study of the body holding and releasing tension. " + STYLE_BLOCK
        ),
    },
    {
        "file": "blog-patterns.jpg",
        "aspect": "4:3",
        "placeholder_cap": "Journal — patterns",
        "prompt": (
            "Two golden candle flames reflected many times in a dark antique mirror, "
            "creating a repeating pattern of lights fading into warm darkness, "
            "symbolic and moody still life. " + STYLE_BLOCK
        ),
    },
    {
        "file": "blog-art.jpg",
        "aspect": "4:3",
        "placeholder_cap": "Journal — art therapy",
        "prompt": (
            "A first hesitant golden brushstroke on a blank cream canvas, brush still touching the surface, "
            "candle flame and paint jars blurred in warm bokeh behind, "
            "symbolizing the courage to begin. " + STYLE_BLOCK
        ),
    },
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def headers():
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def submit_task(img: dict) -> str | None:
    """Submit a generation request; return taskId or None on error."""
    payload = {
        "prompt": img["prompt"],
        "aspectRatio": img["aspect"],
        "outputFormat": "jpeg",
        "model": "flux-kontext-pro",
        "enableTranslation": False,
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

        if success == 1:
            url = (record.get("response") or {}).get("resultImageUrl")
            return url
        elif success == 0:
            err = record.get("errorMessage") or record.get("errorCode", "unknown")
            print(f"  [failed] {err}")
            return None
        # successFlag is None / missing → still processing
        print(f"  … waiting (taskId={task_id})")

    print(f"  [timeout] {task_id}")
    return None


def download(url: str, dest: Path) -> bool:
    """Download image to dest. Return True on success."""
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        dest.write_bytes(r.content)
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
