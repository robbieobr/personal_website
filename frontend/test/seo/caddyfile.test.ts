import { describe, it, expect } from 'vitest';
import { parseSiteHost } from '../../seo/caddyfile';
import { caddyfile, placeholderCaddyfile } from './fixtures';

describe('parseSiteHost', () => {
  it('reads the host of the first reverse-proxied site block', () => {
    expect(parseSiteHost(caddyfile)).toBe('sample-person.test');
  });

  it('ignores the www redirect block', () => {
    const config = `www.site.test {\n  redir https://site.test{uri} permanent\n}\n
site.test {\n  reverse_proxy frontend:3000\n}\n`;

    expect(parseSiteHost(config)).toBe('site.test');
  });

  it('ignores a www address listed alongside the apex', () => {
    expect(parseSiteHost('www.site.test, site.test {\n  reverse_proxy frontend:3000\n}')).toBe(
      'site.test'
    );
  });

  it('ignores the snippet definition', () => {
    const config = `(hardening) {\n  reverse_proxy nowhere:1\n}\n
site.test {\n  import hardening\n  reverse_proxy frontend:3000\n}\n`;

    expect(parseSiteHost(config)).toBe('site.test');
  });

  it('ignores the global options block', () => {
    const config = `{\n  email admin@site.test\n}\n
site.test {\n  reverse_proxy frontend:3000\n}\n`;

    expect(parseSiteHost(config)).toBe('site.test');
  });

  it('reads a site block written on one line', () => {
    expect(parseSiteHost('site.test { reverse_proxy frontend:3000 }')).toBe('site.test');
  });

  it('strips a scheme, port and path from the address', () => {
    expect(parseSiteHost('https://site.test:8443/cv {\n  reverse_proxy frontend:3000\n}')).toBe(
      'site.test'
    );
  });

  it('walks past a nested block inside a site block', () => {
    const config = `site.test {\n  header {\n    X-Frame-Options "DENY"\n  }\n  reverse_proxy frontend:3000\n}`;
    expect(parseSiteHost(config)).toBe('site.test');
  });

  it('ignores a commented-out site block', () => {
    const config = `# other.test {\n#   reverse_proxy other:3000\n# }\n
site.test {\n  reverse_proxy frontend:3000\n}\n`;

    expect(parseSiteHost(config)).toBe('site.test');
  });

  it('keeps a hash inside a quoted value', () => {
    const config = `site.test {\n  header X-Note "a # b"\n  reverse_proxy frontend:3000\n}`;
    expect(parseSiteHost(config)).toBe('site.test');
  });

  it('returns null for the placeholder template', () => {
    expect(parseSiteHost(placeholderCaddyfile)).toBeNull();
  });

  it('returns null for a placeholder subdomain', () => {
    expect(parseSiteHost('app.example.com {\n  reverse_proxy frontend:3000\n}')).toBeNull();
  });

  it('returns null when no block reverse-proxies', () => {
    expect(parseSiteHost('site.test {\n  respond "hello"\n}')).toBeNull();
  });

  it('returns null for a wildcard address', () => {
    expect(parseSiteHost('*.site.test {\n  reverse_proxy frontend:3000\n}')).toBeNull();
  });

  it('returns null for an address with no dot', () => {
    expect(parseSiteHost('localhost:2015 {\n  reverse_proxy frontend:3000\n}')).toBeNull();
  });

  it('returns null for a bare port address', () => {
    expect(parseSiteHost(':80 {\n  reverse_proxy frontend:3000\n}')).toBeNull();
  });

  it('returns null for an IP address', () => {
    expect(parseSiteHost('203.0.113.4 {\n  reverse_proxy frontend:3000\n}')).toBeNull();
  });

  it('returns null for a malformed address', () => {
    expect(parseSiteHost('.site.test- {\n  reverse_proxy frontend:3000\n}')).toBeNull();
  });

  it('returns null for an empty file', () => {
    expect(parseSiteHost('')).toBeNull();
  });
});
