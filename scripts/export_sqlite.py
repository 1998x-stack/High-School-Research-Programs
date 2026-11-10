#!/usr/bin/env python3
"""Build a queryable SQLite edition of the GitHub Pages research catalog.

No external Python packages. Source: docs/data/catalog.json
Never use this SQLite snapshot to infer real-time applications.
"""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "data" / "catalog.json"
DEST = ROOT / "docs" / "data" / "catalog.sqlite"

payload = json.loads(SOURCE.read_text(encoding="utf-8"))
entries = payload["programs"]
DEST.unlink(missing_ok=True)
with sqlite3.connect(DEST) as con:
    con.execute("""CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)""")
    con.executemany("INSERT INTO metadata VALUES (?,?)", [
        ("schema_version", payload.get("schema_version", "")),
        ("as_of", payload.get("as_of", "")),
        ("total", str(len(entries))),
        ("caveat", payload.get("caveat", "")),
    ])
    con.execute("""
      CREATE TABLE programs (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, host TEXT NOT NULL,
        parent TEXT, country TEXT, province TEXT, city TEXT, tier TEXT,
        type TEXT, field TEXT, delivery TEXT, duration TEXT,
        eligibility TEXT, mainland TEXT, fee TEXT, cost TEXT, aid TEXT,
        deadline TEXT, year INTEGER, status TEXT, source_url TEXT NOT NULL,
        source_date TEXT, checked_at TEXT, notes TEXT,
        data_json TEXT NOT NULL
      )
    """)
    fields = ("id name host parent country province city tier type field delivery "
              "duration eligibility mainland fee cost aid deadline year status "
              "source_url source_date checked_at notes").split()
    statement = "INSERT INTO programs VALUES (" + ",".join("?" for _ in range(len(fields)+1)) + ")"
    con.executemany(statement, [
        (*[p.get(k) for k in fields], json.dumps(p, ensure_ascii=False, separators=(",", ":")))
        for p in entries
    ])
    con.execute("CREATE INDEX idx_programs_region ON programs(country, province)")
    con.execute("CREATE INDEX idx_programs_tier ON programs(tier)")
    con.execute("CREATE INDEX idx_programs_cost ON programs(cost)")
    con.execute("CREATE INDEX idx_programs_deadline ON programs(deadline)")
    try:
        con.execute("CREATE VIRTUAL TABLE search_index USING fts5(id UNINDEXED, name, host, field, notes, tokenize='unicode61')")
        con.executemany("INSERT INTO search_index(id, name, host, field, notes) VALUES (?,?,?,?,?)", [
            (p["id"],p.get("name",""),p.get("host",""),p.get("field",""),p.get("notes","")) for p in entries
        ])
    except sqlite3.OperationalError:
        print("FTS5 unavailable; indexed filter queries still supported.")
    assert con.execute("SELECT COUNT(*) FROM programs").fetchone()[0] == len(entries)
print(f"SQLite exported: {DEST} ({len(entries)} records)")
