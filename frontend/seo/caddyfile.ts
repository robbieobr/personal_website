/**
 * Reads the canonical site host out of a Caddyfile.
 *
 * The Caddyfile is deployment state: it is gitignored and bind-mounted into the
 * running Caddy container. `Caddyfile.example` ships the placeholder domains
 * that this module rejects.
 */

interface CaddyBlock {
  addresses: string[];
  body: string;
}

const PLACEHOLDER_HOST = /(^|\.)example\.(com|org|net)$/i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const RESERVED_IN_HOST = /[\s/:{}*@?#]/;

/** Removes the trailing `# ...` comment from a line, ignoring `#` inside a quoted token. */
function stripComment(line: string): string {
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === '#' && !quoted && (index === 0 || /\s/.test(line[index - 1]))) {
      return line.slice(0, index);
    }
  }

  return line;
}

function netBraces(text: string): number {
  let net = 0;
  let quoted = false;

  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === '{') net += 1;
    else if (!quoted && char === '}') net -= 1;
  }

  return net;
}

/**
 * Splits the file into its top-level blocks.
 *
 * A block with an empty header is the global options block and a header opening
 * with `(` is a reusable snippet; neither names a site, so both are dropped.
 */
function readBlocks(caddyfile: string): CaddyBlock[] {
  const blocks: CaddyBlock[] = [];
  let header: string | null = null;
  let body: string[] = [];
  let depth = 0;

  const close = () => {
    const addresses = (header ?? '')
      .split(/[\s,]+/)
      .map((address) => address.trim())
      .filter(Boolean);

    if (addresses.length > 0 && !addresses[0].startsWith('(')) {
      blocks.push({ addresses, body: body.join('\n') });
    }

    header = null;
    body = [];
    depth = 0;
  };

  for (const rawLine of caddyfile.split(/\r?\n/)) {
    const line = stripComment(rawLine);

    if (depth === 0) {
      const open = line.indexOf('{');
      if (open === -1) continue;

      header = line.slice(0, open).trim();
      const rest = line.slice(open + 1);
      body = [rest];
      depth = 1 + netBraces(rest);

      if (depth <= 0) close();
      continue;
    }

    depth += netBraces(line);

    if (depth <= 0) {
      body.push(line);
      close();
      continue;
    }

    body.push(line);
  }

  return blocks;
}

/** Reduces a Caddy site address to a bare hostname, or null when it does not name one. */
function normaliseHost(address: string): string | null {
  let host = address.trim().toLowerCase();

  host = host.replace(/^https?:\/\//, '');
  host = host.split('/')[0];
  host = host.replace(/:\d+$/, '');

  if (!host || !host.includes('.')) return null;
  if (RESERVED_IN_HOST.test(host)) return null;
  if (host.startsWith('.') || host.endsWith('.')) return null;
  if (host.startsWith('-') || host.endsWith('-')) return null;
  if (IPV4.test(host)) return null;

  return host;
}

/**
 * Returns the host of the first site block that reverse-proxies traffic.
 *
 * `www.` addresses are skipped so a redirect block never becomes the canonical
 * host. Returns null when no such block exists or when it still carries the
 * template's placeholder domain.
 */
export function parseSiteHost(caddyfile: string): string | null {
  for (const block of readBlocks(caddyfile)) {
    if (!/\breverse_proxy\b/.test(block.body)) continue;

    for (const address of block.addresses) {
      const host = normaliseHost(address);
      if (host === null || host.startsWith('www.')) continue;
      return PLACEHOLDER_HOST.test(host) ? null : host;
    }
  }

  return null;
}
