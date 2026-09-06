"""Reads the canonical site host out of a Caddyfile.

The Caddyfile is deployment state: it is gitignored and bind-mounted into the
running Caddy container. `Caddyfile.example` ships the placeholder domains that
this module rejects.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

PLACEHOLDER_HOST = re.compile(r"(^|\.)example\.(com|org|net)$", re.IGNORECASE)
IPV4 = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")
RESERVED_IN_HOST = re.compile(r"[\s/:{}*@?#]")
REVERSE_PROXY = re.compile(r"\breverse_proxy\b")
ADDRESS_SEPARATOR = re.compile(r"[\s,]+")


@dataclass(frozen=True)
class CaddyBlock:
    """A top-level site block: the addresses in its header and the text of its body."""

    addresses: tuple[str, ...]
    body: str


def strip_comment(line: str) -> str:
    """Removes the trailing `# ...` comment from a line, ignoring `#` inside a quoted token."""
    quoted = False

    for index, char in enumerate(line):
        if char == '"':
            quoted = not quoted
            continue

        if char == "#" and not quoted and (index == 0 or line[index - 1].isspace()):
            return line[:index]

    return line


def net_braces(text: str) -> int:
    """The number of `{` less the number of `}` outside quoted tokens."""
    net = 0
    quoted = False

    for char in text:
        if char == '"':
            quoted = not quoted
        elif not quoted and char == "{":
            net += 1
        elif not quoted and char == "}":
            net -= 1

    return net


def read_blocks(caddyfile: str) -> list[CaddyBlock]:
    """Splits the file into its top-level blocks.

    A block with an empty header is the global options block and a header opening
    with `(` is a reusable snippet; neither names a site, so both are dropped.
    """
    blocks: list[CaddyBlock] = []
    header: str | None = None
    body: list[str] = []
    depth = 0

    def close() -> None:
        nonlocal header, body, depth

        addresses = [part for part in ADDRESS_SEPARATOR.split(header or "") if part]
        if addresses and not addresses[0].startswith("("):
            blocks.append(CaddyBlock(addresses=tuple(addresses), body="\n".join(body)))

        header = None
        body = []
        depth = 0

    for raw_line in caddyfile.splitlines():
        line = strip_comment(raw_line)

        if depth == 0:
            open_brace = line.find("{")
            if open_brace == -1:
                continue

            header = line[:open_brace].strip()
            rest = line[open_brace + 1 :]
            body = [rest]
            depth = 1 + net_braces(rest)

            if depth <= 0:
                close()
            continue

        depth += net_braces(line)
        body.append(line)

        if depth <= 0:
            close()

    return blocks


def normalise_host(address: str) -> str | None:
    """Reduces a Caddy site address to a bare hostname, or None when it does not name one."""
    host = address.strip().lower()

    host = re.sub(r"^https?://", "", host)
    host = host.split("/")[0]
    host = re.sub(r":\d+$", "", host)

    if not host or "." not in host:
        return None
    if RESERVED_IN_HOST.search(host):
        return None
    if host.startswith(".") or host.endswith("."):
        return None
    if host.startswith("-") or host.endswith("-"):
        return None
    if IPV4.match(host):
        return None

    return host


def parse_site_host(caddyfile: str) -> str | None:
    """Returns the host of the first site block that reverse-proxies traffic.

    `www.` addresses are skipped so a redirect block never becomes the canonical
    host. Returns None when no such block exists or when it still carries the
    template's placeholder domain.
    """
    for block in read_blocks(caddyfile):
        if not REVERSE_PROXY.search(block.body):
            continue

        for address in block.addresses:
            host = normalise_host(address)
            if host is None or host.startswith("www."):
                continue
            return None if PLACEHOLDER_HOST.search(host) else host

    return None
