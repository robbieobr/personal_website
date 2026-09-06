"""Reads the site owner out of the production seed SQL.

The seed is deployment state: it is gitignored and only present on a host that
has been given real data. `500_prod_seed.sql.example` ships the placeholder
values that this module rejects.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .sql import Row, SqlInsert, SqlParseError, parse_inserts, rows_for

PLACEHOLDER_NAMES = ("your name",)
PLACEHOLDER_TITLES = ("your title",)
PLACEHOLDER_EMAIL = re.compile(r"@example\.(com|org|net)$", re.IGNORECASE)

CHILD_TABLES = ("contact_info", "job_history", "education", "projects", "skills")
NUMERIC_ID = re.compile(r"^\d+$")


@dataclass(frozen=True)
class ContactEntry:
    """One contact_info row: its type and the value it holds."""

    type: str
    value: str


@dataclass(frozen=True)
class SiteOwner:
    """The first user in the seed and the rows belonging to that user."""

    name: str
    title: str
    bio: str
    #: Path to the profile photo as the app requests it, relative to the public directory.
    profile_image: str | None
    contacts: tuple[ContactEntry, ...] = ()
    skills: tuple[str, ...] = ()
    #: Company of the role with no end date.
    employer: str | None = None
    #: Institution of the most recently finished course of study.
    institution: str | None = None


def text(value: str | None) -> str:
    """The trimmed value of a column, with a missing or NULL column reading as empty."""
    return value.strip() if isinstance(value, str) else ""


def owner_id_of(row: Row) -> str | None:
    """Reads the `userId` / `user_id` column, whichever the table uses."""
    return row.get("userId") if row.get("userId") is not None else row.get("user_id")


def rows_owned_by(inserts: list[SqlInsert], table: str, owner_id: str | None) -> list[Row]:
    """The rows of `table` that name `owner_id`, plus any row that names no owner."""
    rows = rows_for(inserts, table)
    if owner_id is None:
        return rows
    return [row for row in rows if owner_id_of(row) in (None, owner_id)]


def resolve_owner_id(inserts: list[SqlInsert], user_row: Row) -> str | None:
    """The id the first users row holds.

    That is its explicit column, or else the lowest id any child table references.
    """
    explicit = text(user_row.get("id"))
    if explicit:
        return explicit

    referenced = [
        int(owner)
        for table in CHILD_TABLES
        for row in rows_for(inserts, table)
        if (owner := owner_id_of(row)) is not None and NUMERIC_ID.match(owner)
    ]

    return str(min(referenced)) if referenced else None


def read_contacts(rows: list[Row]) -> tuple[ContactEntry, ...]:
    """The named contact rows, ordered by their display_order column."""
    ordered = []

    for row in rows:
        contact_type = text(row.get("type")).lower()
        value = text(row.get("value"))
        if not contact_type or not value:
            continue

        try:
            order = float(text(row.get("display_order")) or "0")
        except ValueError:
            order = 0.0

        ordered.append((order, ContactEntry(type=contact_type, value=value)))

    return tuple(entry for _, entry in sorted(ordered, key=lambda item: item[0]))


def read_employer(rows: list[Row]) -> str | None:
    """The company of the role with no end date.

    Falls back to the company of the role that ended most recently.
    """
    current = [
        row
        for row in rows
        if "endDate" in row and row["endDate"] is None and text(row.get("company"))
    ]
    if current:
        return text(max(current, key=lambda row: text(row.get("startDate"))).get("company"))

    ended = [row for row in rows if text(row.get("company"))]
    if not ended:
        return None

    return text(max(ended, key=lambda row: text(row.get("endDate"))).get("company"))


def read_institution(rows: list[Row]) -> str | None:
    """The institution of the course of study that finished most recently."""
    named = [row for row in rows if text(row.get("institution"))]
    if not named:
        return None

    return text(max(named, key=lambda row: text(row.get("endDate"))).get("institution"))


def is_placeholder(name: str, title: str, contacts: tuple[ContactEntry, ...]) -> bool:
    """Whether the values are the ones the seed template ships."""
    if name.lower() in PLACEHOLDER_NAMES:
        return True
    if title.lower() in PLACEHOLDER_TITLES:
        return True

    email = next((contact for contact in contacts if contact.type == "email"), None)
    return email is not None and PLACEHOLDER_EMAIL.search(email.value) is not None


def parse_site_owner(sql: str) -> SiteOwner | None:
    """Parses the seed into the first user it inserts and the rows belonging to that user.

    Returns None when the SQL is malformed, has no usable users row, or still
    holds the template placeholders.
    """
    try:
        inserts = parse_inserts(sql)
    except SqlParseError:
        return None

    users = rows_for(inserts, "users")
    if not users:
        return None

    user_row = users[0]
    name = text(user_row.get("name"))
    title = text(user_row.get("title"))
    if not name or not title:
        return None

    owner_id = resolve_owner_id(inserts, user_row)
    contacts = read_contacts(rows_owned_by(inserts, "contact_info", owner_id))
    if is_placeholder(name, title, contacts):
        return None

    return SiteOwner(
        name=name,
        title=title,
        bio=text(user_row.get("bio")),
        profile_image=text(user_row.get("profileImage")) or None,
        contacts=contacts,
        skills=tuple(
            skill
            for row in rows_owned_by(inserts, "skills", owner_id)
            if (skill := text(row.get("skill")))
        ),
        employer=read_employer(rows_owned_by(inserts, "job_history", owner_id)),
        institution=read_institution(rows_owned_by(inserts, "education", owner_id)),
    )
