#!/usr/bin/env python3
"""Key a flat background out of a character portrait into a transparent PNG.

Two strategies:
  - flood  (default): edge-connected flood fill seeded from the border, so
    interior regions that match the background hue (e.g. purple hair on a
    lavender field) are preserved.
  - global: remove every background-colored pixel regardless of connectivity.
    Use when the figure encloses background (e.g. a hollow neon star) and the
    subject shares no color with the key (e.g. a purple/white/black character
    on a chroma-green screen).

`--despill green` neutralizes the green halo left on white/light edges after a
green-screen key by clamping each kept pixel's green channel to max(red, blue).

Usage:
    python tools/cutout.py assets/nerya-mascot.png assets/nerya-cutout.png
    python tools/cutout.py IN OUT --mode global --tol 120 --despill green
"""
from __future__ import annotations

import argparse
import sys
from collections import deque

from PIL import Image, ImageFilter

try:
    import numpy as np
except Exception:  # pragma: no cover
    np = None


def sample_bg(arr):
    """Median color of a thin border frame."""
    h, w, _ = arr.shape
    b = max(2, min(h, w) // 80)
    border = np.concatenate(
        [
            arr[:b, :, :3].reshape(-1, 3),
            arr[-b:, :, :3].reshape(-1, 3),
            arr[:, :b, :3].reshape(-1, 3),
            arr[:, -b:, :3].reshape(-1, 3),
        ]
    )
    return np.median(border, axis=0)


def despill_green(arr: "np.ndarray") -> None:
    """Clamp the green channel to max(red, blue) so the green key edge fringe
    is neutralized. Safe for purple/white/black/gold subjects: none of them
    legitimately carry green above both red and blue."""
    rgb = arr[:, :, :3]
    rb_max = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    rgb[:, :, 1] = np.minimum(rgb[:, :, 1], rb_max)


def key_out(
    in_path: str,
    out_path: str,
    tol: float,
    feather: float,
    mode: str,
    despill: str,
) -> None:
    if np is None:
        sys.exit("numpy is required: pip install numpy")

    img = Image.open(in_path).convert("RGBA")
    arr = np.asarray(img).astype(np.int16)
    h, w, _ = arr.shape

    bg = sample_bg(arr)
    dist = np.sqrt(((arr[:, :, :3] - bg) ** 2).sum(axis=2))
    similar = dist < tol  # candidate background pixels

    if mode == "global":
        # Remove every background-colored pixel regardless of connectivity.
        # Useful when the figure encloses background (e.g. a hollow star).
        visited = similar
    else:
        # Edge-connected flood fill across `similar`, seeded from the border.
        # Interior regions that match the background hue (purple hair) survive.
        visited = np.zeros((h, w), dtype=bool)
        dq = deque()
        for x in range(w):
            for y in (0, h - 1):
                if similar[y, x] and not visited[y, x]:
                    visited[y, x] = True
                    dq.append((y, x))
        for y in range(h):
            for x in (0, w - 1):
                if similar[y, x] and not visited[y, x]:
                    visited[y, x] = True
                    dq.append((y, x))

        while dq:
            y, x = dq.popleft()
            if y > 0 and similar[y - 1, x] and not visited[y - 1, x]:
                visited[y - 1, x] = True
                dq.append((y - 1, x))
            if y < h - 1 and similar[y + 1, x] and not visited[y + 1, x]:
                visited[y + 1, x] = True
                dq.append((y + 1, x))
            if x > 0 and similar[y, x - 1] and not visited[y, x - 1]:
                visited[y, x - 1] = True
                dq.append((y, x - 1))
            if x < w - 1 and similar[y, x + 1] and not visited[y, x + 1]:
                visited[y, x + 1] = True
                dq.append((y, x + 1))

    alpha = np.where(visited, 0, 255).astype("uint8")
    alpha_img = Image.fromarray(alpha, mode="L")

    # Pull the matte in by ~1px to kill the lavender fringe, then feather.
    alpha_img = alpha_img.filter(ImageFilter.MinFilter(3))
    if feather > 0:
        alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(feather))

    if despill == "green":
        rgb = np.asarray(img).astype(np.int16)
        despill_green(rgb)
        out = Image.fromarray(rgb.astype("uint8"), mode="RGBA")
    else:
        out = img.copy()
    out.putalpha(alpha_img)

    # Crop to the content bbox so the cut-out has no dead margin.
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)

    out.save(out_path)
    print(f"wrote {out_path}  size={out.size}  bg={bg.astype(int).tolist()}  tol={tol}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("outp")
    ap.add_argument("--tol", type=float, default=46.0)
    ap.add_argument("--feather", type=float, default=1.1)
    ap.add_argument("--mode", choices=["flood", "global"], default="flood")
    ap.add_argument("--despill", choices=["none", "green"], default="none")
    args = ap.parse_args()
    key_out(args.inp, args.outp, args.tol, args.feather, args.mode, args.despill)


if __name__ == "__main__":
    main()
