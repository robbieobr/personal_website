"""Reader for the INSERT statements in a MySQL seed file.

The scanner is quote-aware: string literals may span lines and may contain
comment markers, statement separators and parentheses. Malformed input raises
`SqlParseError` so callers can fall back rather than act on a half-parsed row.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

Row = dict[str, str | None]

INSERT_HEADER = re.compile(
    r"\s*INSERT\s+INTO\s+`?([A-Za-z0-9_$]+)`?\s*\(([^)]*)\)\s*VALUES",
    re.IGNORECASE,
)

BACKSLASH_ESCAPES = {
    "0": "\0",
    "b": "\b",
    "n": "\n",
    "r": "\r",
    "t": "\t",
    "Z": "\x1a",
    "\\": "\\",
    "'": "'",
    '"': '"',
}


class SqlParseError(ValueError):
    """Raised when the seed cannot be scanned into whole statements and tuples."""


@dataclass(frozen=True)
class SqlInsert:
    """One INSERT statement: its table, its column list and its rows."""

    table: str
    columns: tuple[str, ...]
    rows: tuple[Row, ...]


def _peek(text: str, index: int) -> str:
    return text[index] if 0 <= index < len(text) else ""


def read_literal(sql: str, start: int) -> tuple[str, int]:
    """Reads a quoted literal starting at `start`, returning its raw text and the index after it."""
    quote = sql[start]
    index = start + 1

    while index < len(sql):
        char = sql[index]

        if char == "\\":
            index += 2
            continue

        if char == quote:
            # A doubled quote is an escaped quote, not the end of the literal.
            if _peek(sql, index + 1) == quote:
                index += 2
                continue
            return sql[start : index + 1], index + 1

        index += 1

    raise SqlParseError("Unterminated string literal")


def decode_literal(raw: str) -> str:
    """Decodes a raw quoted literal, resolving doubled-quote and backslash escapes."""
    quote = raw[0]
    body = raw[1:-1]
    value: list[str] = []
    index = 0

    while index < len(body):
        char = body[index]

        if char == "\\":
            escaped = _peek(body, index + 1)
            if escaped:
                value.append(BACKSLASH_ESCAPES.get(escaped, escaped))
            index += 2
            continue

        if char == quote and _peek(body, index + 1) == quote:
            value.append(quote)
            index += 2
            continue

        value.append(char)
        index += 1

    return "".join(value)


def read_statements(sql: str) -> list[str]:
    """Splits SQL into statements, dropping `--`, `#` and block comments found outside literals."""
    statements: list[str] = []
    current: list[str] = []
    index = 0

    def flush() -> None:
        text = "".join(current)
        if text.strip():
            statements.append(text)
        current.clear()

    while index < len(sql):
        char = sql[index]

        if char in ("'", '"'):
            raw, index = read_literal(sql, index)
            current.append(raw)
            continue

        if (char == "-" and _peek(sql, index + 1) == "-") or char == "#":
            line_end = sql.find("\n", index)
            index = len(sql) if line_end == -1 else line_end
            continue

        if char == "/" and _peek(sql, index + 1) == "*":
            block_end = sql.find("*/", index + 2)
            if block_end == -1:
                raise SqlParseError("Unterminated block comment")
            index = block_end + 2
            continue

        if char == ";":
            flush()
            index += 1
            continue

        current.append(char)
        index += 1

    flush()
    return statements


def decode_value(token: str) -> str | None:
    """Turns a single token from a VALUES tuple into its value, with `NULL` becoming None."""
    trimmed = token.strip()
    if trimmed.lower() == "null":
        return None
    if trimmed.startswith("'") or trimmed.startswith('"'):
        return decode_literal(trimmed)
    return trimmed


def read_tuples(text: str) -> list[list[str | None]]:
    """Reads the `(...), (...)` tuple list that follows the VALUES keyword."""
    tuples: list[list[str | None]] = []
    index = 0

    while index < len(text):
        while index < len(text) and text[index] != "(":
            index += 1
        if index >= len(text):
            break
        index += 1

        values: list[str | None] = []
        token: list[str] = []
        closed = False

        while index < len(text):
            char = text[index]

            if char in ("'", '"'):
                raw, index = read_literal(text, index)
                token.append(raw)
                continue

            if char == ",":
                values.append(decode_value("".join(token)))
                token = []
                index += 1
                continue

            if char == ")":
                values.append(decode_value("".join(token)))
                index += 1
                closed = True
                break

            token.append(char)
            index += 1

        if not closed:
            raise SqlParseError("Unterminated VALUES tuple")
        tuples.append(values)

    return tuples


def parse_inserts(sql: str) -> list[SqlInsert]:
    """Parses every INSERT statement in `sql` into column-keyed rows.

    Raises `SqlParseError` on unterminated literals, comments or tuples.
    """
    inserts: list[SqlInsert] = []

    for statement in read_statements(sql):
        header = INSERT_HEADER.match(statement)
        if not header:
            continue

        columns = tuple(
            column.strip().strip("`") for column in header.group(2).split(",") if column.strip()
        )
        if not columns:
            continue

        rows: list[Row] = []
        for values in read_tuples(statement[header.end() :]):
            rows.append(
                {
                    column: values[position] if position < len(values) else None
                    for position, column in enumerate(columns)
                }
            )

        inserts.append(SqlInsert(table=header.group(1).lower(), columns=columns, rows=tuple(rows)))

    return inserts


def rows_for(inserts: list[SqlInsert], table: str) -> list[Row]:
    """Returns every row inserted into `table`, in file order."""
    return [row for insert in inserts if insert.table == table for row in insert.rows]
