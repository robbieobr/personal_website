/**
 * Reads the site owner out of the production seed SQL.
 *
 * The seed is deployment state: it is gitignored and only present on a host
 * that has been given real data. `500_prod_seed.sql.example` ships the
 * placeholder values that this module rejects.
 */

import { parseInserts, rowsFor, type SqlInsert } from './sql';

export interface ContactEntry {
  type: string;
  value: string;
}

export interface SiteOwner {
  name: string;
  title: string;
  bio: string;
  /** Path to the profile photo as the app requests it, relative to the public directory. */
  profileImage: string | null;
  contacts: ContactEntry[];
  skills: string[];
  /** Company of the role with no end date. */
  employer: string | null;
  /** Institution of the most recently finished course of study. */
  institution: string | null;
}

const PLACEHOLDER_NAMES = ['your name'];
const PLACEHOLDER_TITLES = ['your title'];
const PLACEHOLDER_EMAIL = /@example\.(com|org|net)$/i;

function text(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Reads the `userId` / `user_id` column, whichever the table uses. */
function ownerIdOf(row: Record<string, string | null>): string | null {
  return row.userId ?? row.user_id ?? null;
}

function rowsOwnedBy(
  inserts: SqlInsert[],
  table: string,
  ownerId: string | null
): Array<Record<string, string | null>> {
  const rows = rowsFor(inserts, table);
  if (ownerId === null) return rows;
  return rows.filter((row) => {
    const id = ownerIdOf(row);
    return id === null || id === ownerId;
  });
}

/** The id the first users row will hold: its explicit column, else the lowest id referenced elsewhere. */
function resolveOwnerId(
  inserts: SqlInsert[],
  userRow: Record<string, string | null>
): string | null {
  const explicit = text(userRow.id);
  if (explicit) return explicit;

  const referenced = ['contact_info', 'job_history', 'education', 'projects', 'skills']
    .flatMap((table) => rowsFor(inserts, table))
    .map(ownerIdOf)
    .filter((id): id is string => id !== null && /^\d+$/.test(id))
    .map(Number);

  if (referenced.length === 0) return null;
  return String(Math.min(...referenced));
}

function readContacts(rows: Array<Record<string, string | null>>): ContactEntry[] {
  return rows
    .map((row) => ({
      type: text(row.type).toLowerCase(),
      value: text(row.value),
      order: Number(text(row.display_order) || '0'),
    }))
    .filter((contact) => contact.type !== '' && contact.value !== '')
    .sort((a, b) => a.order - b.order)
    .map(({ type, value }) => ({ type, value }));
}

/** The company of the role with no end date, falling back to the one that ended most recently. */
function readEmployer(rows: Array<Record<string, string | null>>): string | null {
  const current = rows.filter((row) => row.endDate === null && text(row.company) !== '');
  if (current.length > 0) {
    const latest = current.reduce((best, row) =>
      text(row.startDate) > text(best.startDate) ? row : best
    );
    return text(latest.company);
  }

  const ended = rows.filter((row) => text(row.company) !== '');
  if (ended.length === 0) return null;

  const latest = ended.reduce((best, row) => (text(row.endDate) > text(best.endDate) ? row : best));
  return text(latest.company);
}

/** The institution of the course of study that finished most recently. */
function readInstitution(rows: Array<Record<string, string | null>>): string | null {
  const named = rows.filter((row) => text(row.institution) !== '');
  if (named.length === 0) return null;

  const latest = named.reduce((best, row) => (text(row.endDate) > text(best.endDate) ? row : best));
  return text(latest.institution);
}

function isPlaceholder(name: string, title: string, contacts: ContactEntry[]): boolean {
  if (PLACEHOLDER_NAMES.includes(name.toLowerCase())) return true;
  if (PLACEHOLDER_TITLES.includes(title.toLowerCase())) return true;

  const email = contacts.find((contact) => contact.type === 'email');
  return email !== undefined && PLACEHOLDER_EMAIL.test(email.value);
}

/**
 * Parses the seed into the first user it inserts and the rows belonging to that user.
 *
 * Returns null when the SQL is malformed, has no usable users row, or still holds
 * the template placeholders.
 */
export function parseSiteOwner(sql: string): SiteOwner | null {
  let inserts: SqlInsert[];
  try {
    inserts = parseInserts(sql);
  } catch {
    return null;
  }

  const userRow = rowsFor(inserts, 'users')[0];
  if (!userRow) return null;

  const name = text(userRow.name);
  const title = text(userRow.title);
  if (!name || !title) return null;

  const ownerId = resolveOwnerId(inserts, userRow);
  const contacts = readContacts(rowsOwnedBy(inserts, 'contact_info', ownerId));
  if (isPlaceholder(name, title, contacts)) return null;

  return {
    name,
    title,
    bio: text(userRow.bio),
    profileImage: text(userRow.profileImage) || null,
    contacts,
    skills: rowsOwnedBy(inserts, 'skills', ownerId)
      .map((row) => text(row.skill))
      .filter(Boolean),
    employer: readEmployer(rowsOwnedBy(inserts, 'job_history', ownerId)),
    institution: readInstitution(rowsOwnedBy(inserts, 'education', ownerId)),
  };
}
