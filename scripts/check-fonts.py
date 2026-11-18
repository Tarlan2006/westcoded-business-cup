"""Verify shipped WOFF2 subsets; optionally compare full candidate TTFs in a folder."""
import argparse
from pathlib import Path
from string import ascii_letters, digits

from fontTools.ttLib import TTFont

FONT_DIR = Path(__file__).resolve().parents[1] / "public" / "fonts"
GROUPS = {
    "Kazakh": set(map(ord, "әӘғҒқҚңҢөӨұҰүҮһҺіІ")),
    "Cyrillic": set(range(0x400, 0x460)),
    "Latin": set(map(ord, ascii_letters)),
    "Digits": set(map(ord, digits)),
}
CANDIDATES = ("rubik", "nunito", "comfortaa", "baloobhai2", "marmelad", "pangolin", "fredoka")


def inspect(path):
    with TTFont(path) as font:
        points = {cp for cp, glyph in font.getBestCmap().items()
                  if font.getGlyphID(glyph) and font["glyf"][glyph].numberOfContours != 0}
        weight = font["OS/2"].usWeightClass
        bounds = (weight, weight)
        if "fvar" in font:
            bounds = next(((int(axis.minValue), int(axis.maxValue)) for axis in font["fvar"].axes
                           if axis.axisTag == "wght"), bounds)
        return points, bounds


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", type=Path, help="Folder with rubik.ttf, nunito.ttf, etc.")
    args = parser.parse_args()
    if args.candidates:
        print("Candidate | Weights | " + " | ".join(GROUPS))
        for name in CANDIDATES:
            points, bounds = inspect(args.candidates / (name + ".ttf"))
            counts = [f"{len(group & points)}/{len(group)}" for group in GROUPS.values()]
            print(" | ".join([name, f"{bounds[0]}–{bounds[1]}", *counts]))

    for family in ("rubik", "nunito"):
        available = set()
        for name in ("latin", "cyrillic", "cyrillic-ext"):
            path = FONT_DIR / f"{family}-{name}-v2.woff2"
            points, (low, high) = inspect(path)
            if low > 600 or high < 900:
                raise ValueError(f"{path.name}: required weights unavailable")
            if name == "latin":
                required = GROUPS["Latin"] | GROUPS["Digits"]
            elif name == "cyrillic":
                required = GROUPS["Cyrillic"]
            else:
                required = GROUPS["Kazakh"] - GROUPS["Cyrillic"]
            missing = required - points
            if missing:
                raise ValueError(f"{path.name}: missing {sorted(missing)}")
            available.update(points)
        if not set.union(*GROUPS.values()) <= available:
            raise ValueError(f"{family}: incomplete alphabet")
    files = [p for p in FONT_DIR.iterdir() if p.suffix in {".woff2", ".woff", ".ttf", ".otf"}]
    size = sum(p.stat().st_size for p in files)
    if size > 150_000:
        raise ValueError(f"Font budget exceeded: {size} bytes")
    print(f"Passed: {len(files)} files, {size:,} bytes")


if __name__ == "__main__":
    main()
