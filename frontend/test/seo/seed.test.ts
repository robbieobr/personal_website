import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseSiteOwner } from '../../seo/seed';
import { seedSql } from './fixtures';

const EXAMPLE_SEED = resolve(
  import.meta.dirname,
  '../../../database/prod-initdb.d/500_prod_seed.sql.example'
);

describe('parseSiteOwner', () => {
  it('reads the owner from the users row', () => {
    const owner = parseSiteOwner(seedSql);

    expect(owner).toMatchObject({
      name: "Sam O'Toole",
      title: 'Staff Platform Engineer',
      profileImage: 'images/sam-profile.jpg',
    });
    expect(owner?.bio).toContain('Sam builds resilient delivery platforms');
  });

  it('reads contact details in display order', () => {
    expect(parseSiteOwner(seedSql)?.contacts).toEqual([
      { type: 'phone', value: '(+353) 000-0000-000' },
      { type: 'email', value: 'sam@sample-person.test' },
      { type: 'website', value: 'https://www.sample-person.test' },
      { type: 'github', value: 'https://github.com/sample-person' },
      { type: 'linkedin', value: 'https://www.linkedin.com/in/sample-person' },
    ]);
  });

  it('reads skills in file order', () => {
    expect(parseSiteOwner(seedSql)?.skills).toEqual([
      'Kubernetes',
      'Go',
      'Terraform',
      'PostgreSQL',
    ]);
  });

  it('reads the employer of the role with no end date', () => {
    expect(parseSiteOwner(seedSql)?.employer).toBe('Northwind Platforms');
  });

  it('reads the most recently finished institution', () => {
    expect(parseSiteOwner(seedSql)?.institution).toBe('Sample University');
  });

  it('picks the latest started role when several are current', () => {
    const sql = `INSERT INTO users (name, title) VALUES ('A', 'B');
INSERT INTO job_history (userId, company, startDate, endDate) VALUES
(1, 'Earlier', '2018-01-01', NULL),
(1, 'Later', '2021-01-01', NULL);`;

    expect(parseSiteOwner(sql)?.employer).toBe('Later');
  });

  it('falls back to the last finished role when none is current', () => {
    const sql = `INSERT INTO users (name, title) VALUES ('A', 'B');
INSERT INTO job_history (userId, company, startDate, endDate) VALUES
(1, 'Older', '2014-01-01', '2016-12-31'),
(1, 'Newer', '2017-01-01', '2019-12-31');`;

    expect(parseSiteOwner(sql)?.employer).toBe('Newer');
  });

  it('keeps only the rows belonging to the first user', () => {
    const sql = `INSERT INTO users (name, title) VALUES ('First', 'Role');
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'first@site.test', 1),
(2, 'email', 'second@site.test', 1);
INSERT INTO skills (userId, skill) VALUES (1, 'Mine'), (2, 'Theirs');`;

    const owner = parseSiteOwner(sql);
    expect(owner?.contacts).toEqual([{ type: 'email', value: 'first@site.test' }]);
    expect(owner?.skills).toEqual(['Mine']);
  });

  it('uses an explicit id column when the users row carries one', () => {
    const sql = `INSERT INTO users (id, name, title) VALUES (7, 'First', 'Role');
INSERT INTO skills (userId, skill) VALUES (1, 'Theirs'), (7, 'Mine');`;

    expect(parseSiteOwner(sql)?.skills).toEqual(['Mine']);
  });

  it('leaves optional fields empty when the seed omits them', () => {
    const owner = parseSiteOwner("INSERT INTO users (name, title) VALUES ('A', 'B');");

    expect(owner).toEqual({
      name: 'A',
      title: 'B',
      bio: '',
      profileImage: null,
      contacts: [],
      skills: [],
      employer: null,
      institution: null,
    });
  });

  it('drops contact rows with no type or no value', () => {
    const sql = `INSERT INTO users (name, title) VALUES ('A', 'B');
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', '', 1),
(1, '', 'x', 2),
(1, 'github', 'https://github.com/a', 3);`;

    expect(parseSiteOwner(sql)?.contacts).toEqual([
      { type: 'github', value: 'https://github.com/a' },
    ]);
  });

  it('returns null for the shipped template', async () => {
    expect(parseSiteOwner(await readFile(EXAMPLE_SEED, 'utf8'))).toBeNull();
  });

  it('returns null for a placeholder name', () => {
    expect(parseSiteOwner("INSERT INTO users (name, title) VALUES ('Your Name', 'X');")).toBeNull();
  });

  it('returns null for a placeholder title', () => {
    expect(
      parseSiteOwner("INSERT INTO users (name, title) VALUES ('X', 'Your Title');")
    ).toBeNull();
  });

  it('returns null for a placeholder email', () => {
    const sql = `INSERT INTO users (name, title) VALUES ('Real Person', 'Real Role');
INSERT INTO contact_info (user_id, type, value, display_order) VALUES (1, 'email', 'you@example.com', 1);`;

    expect(parseSiteOwner(sql)).toBeNull();
  });

  it('returns null when there is no users row', () => {
    expect(parseSiteOwner("INSERT INTO skills (skill) VALUES ('Go');")).toBeNull();
  });

  it('returns null when the users row has no name or title', () => {
    expect(parseSiteOwner("INSERT INTO users (name, title) VALUES ('', 'X');")).toBeNull();
    expect(parseSiteOwner("INSERT INTO users (name) VALUES ('X');")).toBeNull();
  });

  it('returns null for malformed SQL', () => {
    expect(parseSiteOwner("INSERT INTO users (name, title) VALUES ('unterminated")).toBeNull();
  });
});
