"""Smooths the official La Joie logo vectors.

The supplied SVGs are auto-traced from a bitmap: every curve is a polyline on
a half-unit grid, which shows as facets at masthead size. This keeps every
point that forms a real corner (serifs, stems) and fits Catmull-Rom curves
through the rest, then writes src/components/brand/paths.js.

    python3 scripts/smooth-logo.py
"""

import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOGO = (ROOT / "src/assets/brand/logo.svg").read_text()
EMBLEM = (ROOT / "src/assets/brand/amblem.svg").read_text()

CORNER = 38  # degrees of turn that count as a real corner
EPSILON = 0.5  # simplification tolerance, in logo units
LONG = 40  # a segment this long is a straight edge (stem, serif)


def subpaths(d):
    for chunk in re.findall(r"M[^M]+", d):
        pts = [tuple(map(float, p)) for p in re.findall(r"(-?[\d.]+),(-?[\d.]+)", chunk)]
        if pts and pts[0] == pts[-1]:
            pts.pop()
        yield pts


def rdp(points, eps):
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    dists = [abs(dy * (x - x1) - dx * (y - y1)) / norm for x, y in points[1:-1]]
    i = max(range(len(dists)), key=dists.__getitem__)
    if dists[i] > eps:
        return rdp(points[: i + 2], eps)[:-1] + rdp(points[i + 1 :], eps)
    return [points[0], points[-1]]


def simplify_closed(points, eps):
    # split the ring at its two farthest-apart points so RDP sees open runs
    far = max(range(len(points)), key=lambda i: math.dist(points[0], points[i]))
    a = rdp(points[: far + 1], eps)
    b = rdp(points[far:] + [points[0]], eps)
    return a[:-1] + b[:-1]


def turn(prev, cur, nxt):
    a = math.atan2(cur[1] - prev[1], cur[0] - prev[0])
    b = math.atan2(nxt[1] - cur[1], nxt[0] - cur[0])
    return abs((math.degrees(b - a) + 180) % 360 - 180)


def unit(v):
    n = math.hypot(*v) or 1e-9
    return (v[0] / n, v[1] / n)


def tangent(prev, cur, nxt):
    """Direction of the curve through cur. Next to a long straight edge the
    curve follows that edge, the way a bowl meets a stem in type design."""
    a, b = math.dist(prev, cur), math.dist(cur, nxt)
    if max(a, b) > LONG and max(a, b) > 2.5 * min(a, b):
        return unit((cur[0] - prev[0], cur[1] - prev[1])) if a > b else unit((nxt[0] - cur[0], nxt[1] - cur[1]))
    return unit((nxt[0] - prev[0], nxt[1] - prev[1]))


def true_corners(pts, k=3, threshold=50):
    """Corners judged across several points, so 1-2 unit trace jogs don't count."""
    n = len(pts)
    angle = [turn(pts[i - k], pts[i], pts[(i + k) % n]) for i in range(n)]
    return {
        i
        for i in range(n)
        if angle[i] > threshold and angle[i] >= max(angle[(i + d) % n] for d in range(-k, k + 1))
    }


def relax(pts, corners, sigma=1.6, radius=4):
    """Gaussian-smooth the coordinates between corners; corners stay put."""
    n = len(pts)
    weights = [math.exp(-(d * d) / (2 * sigma * sigma)) for d in range(-radius, radius + 1)]
    out = []
    for i in range(n):
        if i in corners:
            out.append(pts[i])
            continue
        sx = sy = sw = 0.0
        for d, w in zip(range(-radius, radius + 1), weights):
            j = (i + d) % n
            # never average across a corner
            if any((i + t) % n in corners for t in range(min(0, d), max(0, d) + 1) if t != 0):
                continue
            sx, sy, sw = sx + pts[j][0] * w, sy + pts[j][1] * w, sw + w
        out.append((sx / sw, sy / sw))
    return out


def resample(points, step=1.0):
    """Even spacing along the outline, keeping every original vertex."""
    out = []
    n = len(points)
    for i in range(n):
        a, b = points[i], points[(i + 1) % n]
        pieces = max(1, int(math.dist(a, b) // step))
        out += [(a[0] + (b[0] - a[0]) * t / pieces, a[1] + (b[1] - a[1]) * t / pieces) for t in range(pieces)]
    return out


def smooth(points):
    points = resample(points)
    corners = true_corners(points, k=4)
    relaxed = relax(points, corners, sigma=3.5, radius=9)
    pts = simplify_closed(relaxed, EPSILON)
    n = len(pts)
    corner = [turn(pts[i - 1], pts[i], pts[(i + 1) % n]) > CORNER for i in range(n)]
    tangents = [tangent(pts[i - 1], pts[i], pts[(i + 1) % n]) for i in range(n)]
    f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")
    out = [f"M{f(pts[0][0])} {f(pts[0][1])}"]
    for i in range(n):
        j = (i + 1) % n
        p1, p2 = pts[i], pts[j]
        if corner[i] and corner[j]:
            out.append(f"L{f(p2[0])} {f(p2[1])}")
            continue
        # handles a third of the segment long, flat at real corners
        h = math.dist(p1, p2) / 3
        t1 = (0, 0) if corner[i] else (tangents[i][0] * h, tangents[i][1] * h)
        t2 = (0, 0) if corner[j] else (tangents[j][0] * h, tangents[j][1] * h)
        c1 = (p1[0] + t1[0], p1[1] + t1[1])
        c2 = (p2[0] - t2[0], p2[1] - t2[1])
        out.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    return "".join(out) + "Z"


def smooth_d(d):
    return "".join(smooth(p) for p in subpaths(d))


letters = re.search(r'<path d="(M 464\.50[^"]+)"', LOGO).group(1)
descriptor = re.search(r'<g fill="#173F32">(.*?)</g>', LOGO, re.S).group(1).strip()
monogram = re.search(r'<path d="(M 106\.50[^"]+)"', EMBLEM).group(1)

(ROOT / "src/components/brand/paths.js").write_text(
    "// Vector data from the official La Joie logo files (Signature 03),\n"
    "// smoothed by scripts/smooth-logo.py. Do not edit by hand.\n"
    f"export const letters = '{smooth_d(letters)}';\n\n"
    f"export const descriptor = `{descriptor}`;\n\n"
    f"export const monogram = '{smooth_d(monogram)}';\n"
)
print("paths.js written")
