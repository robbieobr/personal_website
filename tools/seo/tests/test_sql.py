"""Tests for the quote-aware scanner over the seed's INSERT statements."""

from __future__ import annotations

import pytest

from tools.seo.sql import (
    SqlParseError,
    decode_literal,
    parse_inserts,
    read_statements,
    rows_for,
)
from tools.seo.tests.fixtures import SEED_SQL


class TestReadStatements:
    def test_splits_on_semicolons(self):
        assert [text.strip() for text in read_statements("SELECT 1; SELECT 2;")] == [
            "SELECT 1",
            "SELECT 2",
        ]

    def test_drops_a_line_comment(self):
        assert read_statements("-- a note\nSELECT 1;")[0].strip() == "SELECT 1"

    def test_drops_a_hash_comment(self):
        assert read_statements("# a note\nSELECT 1;")[0].strip() == "SELECT 1"

    def test_drops_a_block_comment(self):
        assert read_statements("SELECT /* a note */ 1;")[0].strip() == "SELECT  1"

    def test_keeps_a_line_comment_marker_inside_a_literal(self):
        statements = read_statements("SELECT 'a -- b';")

        assert statements[0].strip() == "SELECT 'a -- b'"

    def test_keeps_a_hash_marker_inside_a_literal(self):
        assert read_statements("SELECT 'a # b';")[0].strip() == "SELECT 'a # b'"

    def test_keeps_a_block_comment_marker_inside_a_literal(self):
        assert read_statements("SELECT 'a /* b';")[0].strip() == "SELECT 'a /* b'"

    def test_keeps_a_semicolon_inside_a_literal(self):
        assert read_statements("SELECT 'a; b';") == ["SELECT 'a; b'"]

    def test_keeps_a_newline_inside_a_literal(self):
        assert read_statements("SELECT 'a\nb';")[0].strip() == "SELECT 'a\nb'"

    def test_drops_an_empty_statement(self):
        assert read_statements(";;\n  \n;") == []

    def test_raises_on_an_unterminated_literal(self):
        with pytest.raises(SqlParseError, match="Unterminated string literal"):
            read_statements("SELECT 'a")

    def test_raises_on_an_unterminated_block_comment(self):
        with pytest.raises(SqlParseError, match="Unterminated block comment"):
            read_statements("SELECT /* a")


class TestDecodeLiteral:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("'plain'", "plain"),
            ("'O''Toole'", "O'Toole"),
            ("'O\\'Toole'", "O'Toole"),
            ('"say ""hi"""', 'say "hi"'),
            ("'line\\nbreak'", "line\nbreak"),
            ("'tab\\there'", "tab\there"),
            ("'back\\\\slash'", "back\\slash"),
            ("'unknown \\q escape'", "unknown q escape"),
            ("''", ""),
        ],
    )
    def test_resolves_escapes(self, raw, expected):
        assert decode_literal(raw) == expected


class TestParseInserts:
    def test_reads_the_table_columns_and_rows(self):
        inserts = parse_inserts("INSERT INTO users (name, title) VALUES ('A', 'B');")

        assert inserts[0].table == "users"
        assert inserts[0].columns == ("name", "title")
        assert inserts[0].rows == ({"name": "A", "title": "B"},)

    def test_reads_several_tuples_from_one_statement(self):
        rows = parse_inserts("INSERT INTO skills (skill) VALUES ('Go'), ('Rust');")[0].rows

        assert [row["skill"] for row in rows] == ["Go", "Rust"]

    def test_reads_null_as_a_missing_value(self):
        rows = parse_inserts("INSERT INTO jobs (company, endDate) VALUES ('A', NULL);")[0].rows

        assert rows[0]["endDate"] is None

    def test_strips_backticks_from_the_table_and_columns(self):
        inserts = parse_inserts("INSERT INTO `users` (`name`) VALUES ('A');")

        assert inserts[0].table == "users"
        assert inserts[0].columns == ("name",)

    def test_lowercases_the_table_name(self):
        assert parse_inserts("insert into Users (name) values ('A');")[0].table == "users"

    def test_keeps_a_comma_and_parenthesis_inside_a_literal(self):
        rows = parse_inserts("INSERT INTO users (bio) VALUES ('a, b) c');")[0].rows

        assert rows[0]["bio"] == "a, b) c"

    def test_fills_a_short_tuple_with_missing_values(self):
        rows = parse_inserts("INSERT INTO users (name, title) VALUES ('A');")[0].rows

        assert rows[0] == {"name": "A", "title": None}

    def test_ignores_statements_that_are_not_inserts(self):
        assert parse_inserts("USE personal_website;\nSELECT 1;") == []

    def test_ignores_an_insert_with_no_column_list(self):
        assert parse_inserts("INSERT INTO users () VALUES ('A');") == []

    def test_raises_on_an_unterminated_tuple(self):
        with pytest.raises(SqlParseError, match="Unterminated VALUES tuple"):
            parse_inserts("INSERT INTO users (name) VALUES ('A'")

    def test_reads_every_table_in_the_seed(self):
        inserts = parse_inserts(SEED_SQL)

        assert {insert.table for insert in inserts} == {
            "users",
            "contact_info",
            "job_history",
            "education",
            "skills",
        }


class TestRowsFor:
    def test_returns_the_rows_of_one_table_in_file_order(self):
        inserts = parse_inserts(
            "INSERT INTO skills (skill) VALUES ('Go');"
            "INSERT INTO users (name) VALUES ('A');"
            "INSERT INTO skills (skill) VALUES ('Rust');"
        )

        assert [row["skill"] for row in rows_for(inserts, "skills")] == ["Go", "Rust"]

    def test_returns_nothing_for_a_table_the_seed_does_not_insert(self):
        assert rows_for(parse_inserts(SEED_SQL), "achievements") == []
