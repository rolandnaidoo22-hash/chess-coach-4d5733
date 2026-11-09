#!/usr/bin/env python3
"""Keeps cache-busting in step with the files, so nobody has to bump version numbers by hand.
 - every <script src="X.js?v=..."> in index.html gets ?v=<first 6 hex of X's content hash>
 - sw.js CACHE name becomes chess-review-<hash of all app files + index.html with the ?v= values removed>
Run from the repo root: python3 tools/bump-version.py   (idempotent: no changes -> no diff)."""
import hashlib, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / "index.html"; sw = root / "sw.js"
html = idx.read_text(encoding="utf-8")
def h(path): return hashlib.sha1(path.read_bytes()).hexdigest()
def stamp(m):
    f = root / m.group(2)
    return f'{m.group(1)}{m.group(2)}?v={h(f)[:6]}"' if f.exists() else m.group(0)
html = re.sub(r'(<script[^>]*\bsrc=")([^"?]+\.js)(?:\?v=[^"]*)?"', stamp, html)
idx.write_text(html, encoding="utf-8")
ASSET_EXT = (".js", ".json", ".webmanifest", ".html", ".png", ".svg", ".css")
SKIP = {"sw.js", "index.html"}
big = {"stockfish.js", "stockfish.wasm", "three.module.min.js", "pieces.bin"}  # live in the separate engine cache
parts = []
for p in sorted(root.iterdir()):
    if p.is_file() and p.name not in SKIP and p.name not in big and p.name.endswith(ASSET_EXT):
        parts.append(p.name + h(p))
parts.append(hashlib.sha1(re.sub(r'\?v=[0-9a-f]+', '', html).encode()).hexdigest())
cache = "chess-review-" + hashlib.sha1("".join(parts).encode()).hexdigest()[:8]
s = sw.read_text(encoding="utf-8")
s2 = re.sub(r'const CACHE = "[^"]*";', f'const CACHE = "{cache}";', s, count=1)
if s2 != s: sw.write_text(s2, encoding="utf-8")
print("CACHE =", cache)
