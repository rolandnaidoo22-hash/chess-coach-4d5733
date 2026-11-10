#!/usr/bin/env python3
"""Build champion-book.json from public monthly chess archives.

The archive account is taken from CHAMPION_ARCHIVE_PLAYER so the generated
JSON never names that player. Run politely: identify this app, pause between
requests, and back off on HTTP 429.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import chess
import chess.pgn
import io

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(os.environ.get("CHAMPION_BOOK_OUT", ROOT / "champion-book.json"))
PLAYER = (os.environ.get("CHAMPION_ARCHIVE_PLAYER") or "").strip().lower()
MONTHS = int(os.environ.get("CHAMPION_BOOK_MONTHS") or "24")
DEPTH = int(os.environ.get("CHAMPION_BOOK_DEPTH") or "14")
MIN_COUNT = int(os.environ.get("CHAMPION_BOOK_MIN_COUNT") or "2")
MIN_SHARE = float(os.environ.get("CHAMPION_BOOK_MIN_SHARE") or "0.12")
GAP = float(os.environ.get("CHAMPION_BOOK_GAP") or "1.1")
UA = os.environ.get(
    "CHAMPION_BOOK_UA",
    "TheUltimateChessApp/champion-book (+https://think-first-preview.chess-review.workers.dev/; preview book builder)",
)
ARCHIVES = "https://api.chess.com/pub/player/{player}/games/archives"
MONTH_URL = "https://api.chess.com/pub/player/{player}/games/{yyyy}/{mm}"


def die(msg: str, code: int = 1) -> None:
    print("error:", msg, file=sys.stderr)
    raise SystemExit(code)


def get_json(url: str) -> dict | None:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    last = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                if r.status == 404:
                    return None
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 404:
                return None
            if e.code == 429:
                wait = 8 * (attempt + 1)
                print(f"429 on {url} — waiting {wait}s", flush=True)
                time.sleep(wait)
                continue
            print(f"http {e.code} on {url} — retry {attempt+1}", flush=True)
            time.sleep(GAP * 2)
        except Exception as e:
            last = e
            print(f"network {e} on {url} — retry {attempt+1}", flush=True)
            time.sleep(GAP * 2)
    die(f"failed to fetch {url}: {last}")


def month_of(url: str) -> str:
    parts = url.rstrip("/").split("/")
    if len(parts) >= 2 and parts[-2].isdigit() and parts[-1].isdigit():
        return f"{parts[-2]}-{parts[-1]}"
    return ""


def age_weight(end_time: int, now: float) -> float:
    days = max(0.0, (now - float(end_time or 0)) / 86400.0)
    return 1.0 / (1.0 + days / 30.0)


def fen_key(board: chess.Board) -> str:
    return " ".join(board.fen().split(" ")[:4])


def walk_game(pgn: str, side: str, weight: float, depth: int, bag, counts) -> int:
    game = chess.pgn.read_game(io.StringIO(pgn))
    if game is None:
        return 0
    board = game.board()
    added = 0
    for i, move in enumerate(game.mainline_moves()):
        if i >= depth:
            break
        if board.is_game_over():
            break
        turn = "w" if board.turn == chess.WHITE else "b"
        if turn == side:
            try:
                san = board.san(move)
            except Exception:
                break
            key = fen_key(board)
            bag[key][san] += weight
            counts[key][san] += 1
            added += 1
        try:
            board.push(move)
        except Exception:
            break
    return added


def keep_moves(moves: dict, counts: dict) -> dict:
    total_w = sum(moves.values()) or 1.0
    kept = {}
    ranked = sorted(moves.items(), key=lambda kv: (-kv[1], kv[0]))
    for i, (san, w) in enumerate(ranked):
        n = counts.get(san, 0)
        share = w / total_w
        if n < MIN_COUNT:
            continue
        if i == 0 or share >= MIN_SHARE or (i < 3 and share >= 0.08):
            kept[san] = round(w, 3)
    return kept


def main() -> None:
    if not PLAYER:
        die("set CHAMPION_ARCHIVE_PLAYER to the public archive account")
    now = time.time()
    print(f"listing archives (last {MONTHS} months, depth {DEPTH})", flush=True)
    listing = get_json(ARCHIVES.format(player=PLAYER))
    urls = list(listing.get("archives") or []) if listing else []
    if urls:
        chosen = urls[-MONTHS:]
        print(f"{len(urls)} archives, using {len(chosen)}: {month_of(chosen[0])} .. {month_of(chosen[-1])}", flush=True)
    else:
        # Some well-known accounts 404 the archives index but still serve monthly files.
        from datetime import date
        d = date.today()
        chosen = []
        y, m = d.year, d.month
        for _ in range(MONTHS):
            chosen.append(MONTH_URL.format(player=PLAYER, yyyy=f"{y:04d}", mm=f"{m:02d}"))
            m -= 1
            if m == 0:
                m = 12
                y -= 1
        chosen = list(reversed(chosen))
        print(f"archives index unavailable; trying constructed months {month_of(chosen[0])} .. {month_of(chosen[-1])}", flush=True)

    bag = defaultdict(lambda: defaultdict(float))
    counts = defaultdict(lambda: defaultdict(int))
    games_used = 0
    skipped = 0
    first_t = None
    last_t = None

    for i, url in enumerate(chosen, 1):
        time.sleep(GAP)
        print(f"[{i}/{len(chosen)}] {month_of(url) or url}", flush=True)
        payload = get_json(url) or {}
        for g in payload.get("games") or []:
            if (g.get("rules") or "chess") != "chess":
                skipped += 1
                continue
            pgn = g.get("pgn") or ""
            if not pgn:
                skipped += 1
                continue
            wu = ((g.get("white") or {}).get("username") or "").lower()
            bu = ((g.get("black") or {}).get("username") or "").lower()
            side = "w" if wu == PLAYER else "b" if bu == PLAYER else None
            if not side:
                skipped += 1
                continue
            end_t = int(g.get("end_time") or 0)
            wt = age_weight(end_t, now)
            n = walk_game(pgn, side, wt, DEPTH, bag, counts)
            if n:
                games_used += 1
                if end_t:
                    first_t = end_t if first_t is None else min(first_t, end_t)
                    last_t = end_t if last_t is None else max(last_t, end_t)
            else:
                skipped += 1

    book = {}
    for key, moves in bag.items():
        kept = keep_moves(moves, counts[key])
        if kept:
            book[key] = kept

    def ymo(ts):
        if not ts:
            return ""
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m")

    data = {
        "builtAt": int(now * 1000),
        "depth": DEPTH,
        "games": games_used,
        "skipped": skipped,
        "from": ymo(first_t),
        "to": ymo(last_t),
        "positions": len(book),
        "minCount": MIN_COUNT,
        "minShare": MIN_SHARE,
        "months": [month_of(u) for u in chosen],
        "book": book,
    }
    OUT.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    size = OUT.stat().st_size
    start = book.get("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -", {})
    print(
        f"wrote {OUT} ({size} bytes) games={games_used} positions={len(book)} "
        f"from={data['from']} to={data['to']} start={start}",
        flush=True,
    )
    if games_used < 40:
        die(f"too few games kept ({games_used})")
    if "e4" not in start and "d4" not in start:
        print("warning: start position has neither e4 nor d4", file=sys.stderr)


if __name__ == "__main__":
    main()
