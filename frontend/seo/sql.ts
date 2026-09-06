/**
 * Reader for the INSERT statements in a MySQL seed file.
 *
 * The scanner is quote-aware: string literals may span lines and may contain
 * comment markers, statement separators and parentheses. Malformed input throws
 * so callers can fall back rather than act on a half-parsed row.
 */

export interface SqlInsert {
  table: string;
  columns: string[];
  rows: Array<Record<string, string | null>>;
}

const INSERT_HEADER = /^\s*INSERT\s+INTO\s+`?([A-Za-z0-9_$]+)`?\s*\(([^)]*)\)\s*VALUES/i;

const BACKSLASH_ESCAPES: Record<string, string> = {
  '0': '\0',
  b: '\b',
  n: '\n',
  r: '\r',
  t: '\t',
  Z: '\u001a',
  '\\': '\\',
  "'": "'",
  '"': '"',
};

/** Reads a quoted literal starting at `start`, returning its raw text and the index after it. */
function readLiteral(sql: string, start: number): { raw: string; end: number } {
  const quote = sql[start];
  let index = start + 1;

  while (index < sql.length) {
    const char = sql[index];

    if (char === '\\') {
      index += 2;
      continue;
    }

    if (char === quote) {
      // A doubled quote is an escaped quote, not the end of the literal.
      if (sql[index + 1] === quote) {
        index += 2;
        continue;
      }
      return { raw: sql.slice(start, index + 1), end: index + 1 };
    }

    index += 1;
  }

  throw new Error('Unterminated string literal');
}

/** Decodes a raw quoted literal into its value, resolving doubled-quote and backslash escapes. */
function decodeLiteral(raw: string): string {
  const quote = raw[0];
  const body = raw.slice(1, -1);
  let value = '';
  let index = 0;

  while (index < body.length) {
    const char = body[index];

    if (char === '\\') {
      const escaped = body[index + 1];
      value += escaped === undefined ? '' : (BACKSLASH_ESCAPES[escaped] ?? escaped);
      index += 2;
      continue;
    }

    if (char === quote && body[index + 1] === quote) {
      value += quote;
      index += 2;
      continue;
    }

    value += char;
    index += 1;
  }

  return value;
}

/** Splits SQL into statements, dropping `--`, `#` and block comments found outside literals. */
function readStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let index = 0;

  const flush = () => {
    if (current.trim()) statements.push(current);
    current = '';
  };

  while (index < sql.length) {
    const char = sql[index];

    if (char === "'" || char === '"') {
      const literal = readLiteral(sql, index);
      current += literal.raw;
      index = literal.end;
      continue;
    }

    if ((char === '-' && sql[index + 1] === '-') || char === '#') {
      const lineEnd = sql.indexOf('\n', index);
      index = lineEnd === -1 ? sql.length : lineEnd;
      continue;
    }

    if (char === '/' && sql[index + 1] === '*') {
      const blockEnd = sql.indexOf('*/', index + 2);
      if (blockEnd === -1) throw new Error('Unterminated block comment');
      index = blockEnd + 2;
      continue;
    }

    if (char === ';') {
      flush();
      index += 1;
      continue;
    }

    current += char;
    index += 1;
  }

  flush();
  return statements;
}

/** Turns a single token from a VALUES tuple into its value, with `NULL` becoming null. */
function decodeValue(token: string): string | null {
  const trimmed = token.trim();
  if (/^null$/i.test(trimmed)) return null;
  if (trimmed.startsWith("'") || trimmed.startsWith('"')) return decodeLiteral(trimmed);
  return trimmed;
}

/** Reads the `(...), (...)` tuple list that follows the VALUES keyword. */
function readTuples(text: string): Array<Array<string | null>> {
  const tuples: Array<Array<string | null>> = [];
  let index = 0;

  while (index < text.length) {
    while (index < text.length && text[index] !== '(') index += 1;
    if (index >= text.length) break;
    index += 1;

    const values: Array<string | null> = [];
    let token = '';
    let closed = false;

    while (index < text.length) {
      const char = text[index];

      if (char === "'" || char === '"') {
        const literal = readLiteral(text, index);
        token += literal.raw;
        index = literal.end;
        continue;
      }

      if (char === ',') {
        values.push(decodeValue(token));
        token = '';
        index += 1;
        continue;
      }

      if (char === ')') {
        values.push(decodeValue(token));
        index += 1;
        closed = true;
        break;
      }

      token += char;
      index += 1;
    }

    if (!closed) throw new Error('Unterminated VALUES tuple');
    tuples.push(values);
  }

  return tuples;
}

/**
 * Parses every INSERT statement in `sql` into column-keyed rows.
 *
 * Throws on unterminated literals, comments or tuples.
 */
export function parseInserts(sql: string): SqlInsert[] {
  const inserts: SqlInsert[] = [];

  for (const statement of readStatements(sql)) {
    const header = INSERT_HEADER.exec(statement);
    if (!header) continue;

    const columns = header[2]
      .split(',')
      .map((column) => column.trim().replace(/^`|`$/g, ''))
      .filter(Boolean);

    if (columns.length === 0) continue;

    const rows = readTuples(statement.slice(header[0].length)).map((values) => {
      const row: Record<string, string | null> = {};
      columns.forEach((column, position) => {
        row[column] = position < values.length ? values[position] : null;
      });
      return row;
    });

    inserts.push({ table: header[1].toLowerCase(), columns, rows });
  }

  return inserts;
}

/** Returns every row inserted into `table`, in file order. */
export function rowsFor(inserts: SqlInsert[], table: string): Array<Record<string, string | null>> {
  return inserts.filter((insert) => insert.table === table).flatMap((insert) => insert.rows);
}
