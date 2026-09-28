"""Transparent cut-outs of the menu photos.

The studio photos sit on the brand's warm cream paper with a "La Joie"
watermark. Cut-outs let the products stand on any surface of the site.
Run after `npm run sync:menu` when new photos arrive:

    python3 -m venv .venv && .venv/bin/pip install "rembg[cpu]" pillow scipy
    .venv/bin/python scripts/cutouts.py            # new photos only
    .venv/bin/python scripts/cutouts.py 36 89      # redo these ids

Segmentation models treat a white plate on cream as background, so the
mask is merged with a colour cue: the paper is warm (red well above blue),
porcelain and glass highlights are neutral. Output is trimmed to the object.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src/assets/menu"
OUT = ROOT / "src/assets/cutouts"
PAD = 0.03  # breathing room around the trimmed object, as a share of its size

# Watermark letters that the mask kept, per photo: (top, right) of the bottom-left
# corner, as shares of the trimmed image, where warm pixels are cleared.
RETOUCH = {"40": (0.905, 0.30)}  # flat white: fragments under the spoon handle


def neutral_mask(rgb: np.ndarray) -> np.ndarray:
    """Soft mask of neutral (white/grey) pixels: plates, saucers, cups."""
    warmth = rgb[..., 0].astype(int) - rgb[..., 2].astype(int)
    soft = np.clip((16 - warmth) / 4, 0, 1)
    solid = soft > 0.5
    solid = ndimage.binary_opening(solid, iterations=2)
    labels, count = ndimage.label(solid)
    if count:
        sizes = ndimage.sum(solid, labels, range(1, count + 1))
        solid = np.isin(labels, 1 + np.flatnonzero(sizes > 1500))
    solid = ndimage.binary_fill_holes(solid)
    return np.where(ndimage.binary_dilation(solid, iterations=2), np.maximum(soft, solid * 1.0), 0)


def clean(alpha: np.ndarray) -> np.ndarray:
    """Drop specks that are far from the main object (watermark fragments)."""
    solid = alpha > 0.5
    labels, count = ndimage.label(solid)
    if count < 2:
        return alpha
    sizes = ndimage.sum(solid, labels, range(1, count + 1))
    keep = np.isin(labels, 1 + np.flatnonzero(sizes >= max(600, sizes.max() * 0.004)))
    near = ndimage.binary_dilation(keep, iterations=3)
    return alpha * near


def cutout(photo: Path, session) -> Image.Image:
    rgb = np.asarray(Image.open(photo).convert("RGB"))
    model = np.asarray(remove(Image.fromarray(rgb), session=session, only_mask=True)).astype(float) / 255
    alpha = clean(np.maximum(model, neutral_mask(rgb)))
    rgba = np.dstack([rgb, (alpha * 255).round().astype(np.uint8)])
    image = Image.fromarray(rgba, "RGBA")

    left, top, right, bottom = image.getbbox()
    pad = round(max(right - left, bottom - top) * PAD)
    box = (max(0, left - pad), max(0, top - pad), min(image.width, right + pad), min(image.height, bottom + pad))
    image = image.crop(box)

    if photo.stem in RETOUCH:
        y, x = RETOUCH[photo.stem]
        px = np.asarray(image).copy()
        h, w = px.shape[:2]
        corner = np.zeros((h, w), bool)
        corner[int(h * y) :, : int(w * x)] = True
        warm = px[..., 0].astype(int) - px[..., 2].astype(int) > 16
        px[..., 3][corner & warm] = 0
        image = Image.fromarray(px, "RGBA")
    return image


def main() -> None:
    only = set(sys.argv[1:])
    session = new_session("isnet-general-use")
    OUT.mkdir(parents=True, exist_ok=True)
    for photo in sorted(SRC.glob("*.jpg"), key=lambda p: int(p.stem)):
        target = OUT / f"{photo.stem}.webp"
        if only and photo.stem not in only or not only and target.exists():
            continue
        cutout(photo, session).save(target, "WEBP", quality=90, method=6)
        print(f"{photo.stem} → {target.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    main()
