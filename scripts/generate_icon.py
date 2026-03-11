from __future__ import annotations

from pathlib import Path
import math
import struct


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "build" / "icon.ico"
SIZES = [16, 24, 32, 48, 64, 128, 256]


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def mix(a: tuple[float, float, float], b: tuple[float, float, float], t: float) -> tuple[float, float, float]:
    return tuple(a[i] * (1.0 - t) + b[i] * t for i in range(3))


def hex_rgb(value: str) -> tuple[float, float, float]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) / 255.0 for i in (0, 2, 4))


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    if edge0 == edge1:
        return 1.0 if x >= edge1 else 0.0
    t = clamp((x - edge0) / (edge1 - edge0))
    return t * t * (3.0 - 2.0 * t)


def point_segment_distance(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    abx = bx - ax
    aby = by - ay
    apx = px - ax
    apy = py - ay
    ab_len_sq = abx * abx + aby * aby
    if ab_len_sq == 0:
        return math.hypot(apx, apy)
    t = clamp((apx * abx + apy * aby) / ab_len_sq)
    closest_x = ax + abx * t
    closest_y = ay + aby * t
    return math.hypot(px - closest_x, py - closest_y)


def barycentric(
    px: float,
    py: float,
    ax: float,
    ay: float,
    bx: float,
    by: float,
    cx: float,
    cy: float,
) -> tuple[float, float, float] | None:
    denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if denom == 0:
        return None
    w1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denom
    w2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denom
    w3 = 1.0 - w1 - w2
    return w1, w2, w3


def overlay(base: tuple[float, float, float, float], color: tuple[float, float, float], alpha: float):
    if alpha <= 0:
        return base
    br, bg, bb, ba = base
    a = clamp(alpha)
    out_a = a + ba * (1.0 - a)
    if out_a <= 0:
      return 0.0, 0.0, 0.0, 0.0
    out_r = (color[0] * a + br * ba * (1.0 - a)) / out_a
    out_g = (color[1] * a + bg * ba * (1.0 - a)) / out_a
    out_b = (color[2] * a + bb * ba * (1.0 - a)) / out_a
    return out_r, out_g, out_b, out_a


def sample_icon(x: float, y: float) -> tuple[float, float, float, float]:
    cx = 0.5
    cy = 0.5
    dx = x - cx
    dy = y - cy
    radius = math.hypot(dx, dy)
    rgba = (0.0, 0.0, 0.0, 0.0)

    coin_radius = 0.345
    ring_inner = 0.317
    highlight_center = (0.38, 0.34)
    highlight_radius = 0.19

    if radius <= coin_radius + 0.006:
        t = clamp(radius / coin_radius)
        top = hex_rgb("#1B1714")
        bottom = hex_rgb("#100E0D")
        coin = mix(top, bottom, smoothstep(0.0, 1.0, y))
        radial = smoothstep(0.0, 1.0, t)
        coin = mix(coin, hex_rgb("#0C0A09"), radial * 0.28)
        rgba = overlay(rgba, coin, 1.0 - smoothstep(coin_radius, coin_radius + 0.006, radius))

        highlight_dx = x - highlight_center[0]
        highlight_dy = y - highlight_center[1]
        highlight = 1.0 - smoothstep(0.0, highlight_radius, math.hypot(highlight_dx, highlight_dy))
        rgba = overlay(rgba, hex_rgb("#FFF5E8"), highlight * 0.05)

    if ring_inner <= radius <= coin_radius + 0.012:
        ring = 1.0 - smoothstep(0.0, 0.018, abs(radius - ((coin_radius + ring_inner) / 2.0)))
        ring_color = mix(hex_rgb("#F0BD77"), hex_rgb("#A9682D"), clamp((x + y) * 0.5))
        rgba = overlay(rgba, ring_color, ring * 0.9)

    branch_color = hex_rgb("#D89A56")
    center = (0.5, 0.535)
    left_node = (0.32, 0.665)
    right_node = (0.68, 0.665)
    top_branch_end = (0.5, 0.34)

    for start, end, width, alpha in (
        (center, top_branch_end, 0.018, 0.95),
        (center, left_node, 0.018, 0.86),
        (center, right_node, 0.018, 0.86),
    ):
        dist = point_segment_distance(x, y, start[0], start[1], end[0], end[1])
        coverage = 1.0 - smoothstep(width, width + 0.01, dist)
        rgba = overlay(rgba, branch_color, coverage * alpha)

    triangle = barycentric(x, y, 0.5, 0.235, 0.557, 0.385, 0.443, 0.385)
    if triangle:
        w1, w2, w3 = triangle
        if min(w1, w2, w3) >= -0.02:
            edge = min(w1, w2, w3)
            alpha = smoothstep(-0.02, 0.015, edge)
            tip_color = mix(hex_rgb("#FFDCAE"), hex_rgb("#C97F39"), clamp((y - 0.235) / 0.15))
            rgba = overlay(rgba, tip_color, alpha)

    inner_triangle = barycentric(x, y, 0.5, 0.31, 0.529, 0.385, 0.471, 0.385)
    if inner_triangle:
        w1, w2, w3 = inner_triangle
        if min(w1, w2, w3) >= -0.015:
            edge = min(w1, w2, w3)
            alpha = smoothstep(-0.015, 0.012, edge)
            rgba = overlay(rgba, hex_rgb("#FFF3DC"), alpha * 0.45)

    for node_center, size, color, inner_color, inner_radius in (
        (center, 0.055, hex_rgb("#D79A56"), hex_rgb("#1A1411"), 0.022),
        (left_node, 0.04, hex_rgb("#CF8F49"), hex_rgb("#1A1411"), 0.015),
        (right_node, 0.04, hex_rgb("#CF8F49"), hex_rgb("#1A1411"), 0.015),
    ):
        node_dist = math.hypot(x - node_center[0], y - node_center[1])
        node_alpha = 1.0 - smoothstep(size, size + 0.01, node_dist)
        rgba = overlay(rgba, color, node_alpha)
        inner_alpha = 1.0 - smoothstep(inner_radius, inner_radius + 0.008, node_dist)
        rgba = overlay(rgba, inner_color, inner_alpha)

    return rgba


def render_bitmap(size: int) -> bytes:
    samples = ((0.25, 0.25), (0.75, 0.25), (0.25, 0.75), (0.75, 0.75))
    pixels = bytearray()

    for py in range(size - 1, -1, -1):
        for px in range(size):
            accum = [0.0, 0.0, 0.0, 0.0]
            for sx, sy in samples:
                x = (px + sx) / size
                y = (py + sy) / size
                r, g, b, a = sample_icon(x, y)
                accum[0] += r
                accum[1] += g
                accum[2] += b
                accum[3] += a

            r = int(clamp(accum[0] / len(samples)) * 255)
            g = int(clamp(accum[1] / len(samples)) * 255)
            b = int(clamp(accum[2] / len(samples)) * 255)
            a = int(clamp(accum[3] / len(samples)) * 255)
            pixels.extend((b, g, r, a))

    mask_row_size = ((size + 31) // 32) * 4
    and_mask = b"\x00" * (mask_row_size * size)
    header = struct.pack(
        "<IIIHHIIIIII",
        40,
        size,
        size * 2,
        1,
        32,
        0,
        len(pixels) + len(and_mask),
        0,
        0,
        0,
        0,
    )
    return header + bytes(pixels) + and_mask


def build_ico() -> bytes:
    images = [render_bitmap(size) for size in SIZES]
    directory = struct.pack("<HHH", 0, 1, len(SIZES))
    entries = []
    offset = 6 + len(SIZES) * 16

    for size, image in zip(SIZES, images, strict=True):
        entries.append(
            struct.pack(
                "<BBBBHHII",
                0 if size == 256 else size,
                0 if size == 256 else size,
                0,
                0,
                1,
                32,
                len(image),
                offset,
            )
        )
        offset += len(image)

    return directory + b"".join(entries) + b"".join(images)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(build_ico())
    print(f"generated {OUTPUT}")


if __name__ == "__main__":
    main()
