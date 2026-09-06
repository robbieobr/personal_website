import { describe, it, expect } from 'vitest';
import { parseInserts, rowsFor } from '../../seo/sql';

describe('parseInserts', () => {
  it('maps values onto their column names', () => {
    const inserts = parseInserts(
      "INSERT INTO users (name, title) VALUES ('Ada Lovelace', 'Mathematician');"
    );

    expect(inserts).toEqual([
      {
        table: 'users',
        columns: ['name', 'title'],
        rows: [{ name: 'Ada Lovelace', title: 'Mathematician' }],
      },
    ]);
  });

  it('reads several tuples from one statement', () => {
    const rows = parseInserts(
      "INSERT INTO skills (userId, skill) VALUES (1, 'Go'),\n(1, 'Rust');"
    )[0].rows;

    expect(rows).toEqual([
      { userId: '1', skill: 'Go' },
      { userId: '1', skill: 'Rust' },
    ]);
  });

  it('resolves doubled-quote escapes', () => {
    const rows = parseInserts("INSERT INTO users (name) VALUES ('Sam O''Toole');")[0].rows;
    expect(rows[0].name).toBe("Sam O'Toole");
  });

  it('resolves backslash escapes', () => {
    const rows = parseInserts(
      "INSERT INTO users (bio) VALUES ('one\\ntwo \\'quoted\\' \\\\ end \\q');"
    )[0].rows;

    expect(rows[0].bio).toBe("one\ntwo 'quoted' \\ end q");
  });

  it('reads double-quoted literals', () => {
    const rows = parseInserts('INSERT INTO users (name) VALUES ("Ada \\"A\\" Lovelace");')[0].rows;
    expect(rows[0].name).toBe('Ada "A" Lovelace');
  });

  it('keeps values that span several lines', () => {
    const rows = parseInserts("INSERT INTO users (bio) VALUES ('first\nsecond');")[0].rows;
    expect(rows[0].bio).toBe('first\nsecond');
  });

  it('reads NULL as null', () => {
    const rows = parseInserts("INSERT INTO jobs (company, endDate) VALUES ('Acme', NULL);")[0].rows;
    expect(rows[0].endDate).toBeNull();
  });

  it('fills missing trailing columns with null', () => {
    const rows = parseInserts("INSERT INTO users (name, title) VALUES ('Ada');")[0].rows;
    expect(rows[0]).toEqual({ name: 'Ada', title: null });
  });

  it('ignores statements that are not inserts', () => {
    expect(parseInserts('USE personal_website;\nALTER TABLE users DROP COLUMN email;')).toEqual([]);
  });

  it('ignores an insert with no column list', () => {
    expect(parseInserts("INSERT INTO users () VALUES ('Ada');")).toEqual([]);
  });

  it('strips line and block comments outside literals', () => {
    const inserts = parseInserts(
      `-- leading note
# hash note
/* block note */
INSERT INTO users (name) VALUES ('Ada'); -- trailing note`
    );

    expect(inserts[0].rows[0].name).toBe('Ada');
  });

  it('keeps comment markers that appear inside a literal', () => {
    const rows = parseInserts("INSERT INTO users (bio) VALUES ('a -- b # c /* d */');")[0].rows;
    expect(rows[0].bio).toBe('a -- b # c /* d */');
  });

  it('keeps semicolons and parentheses that appear inside a literal', () => {
    const rows = parseInserts("INSERT INTO users (bio) VALUES ('a; (b) c');")[0].rows;
    expect(rows[0].bio).toBe('a; (b) c');
  });

  it('reads a final statement with no trailing semicolon', () => {
    expect(parseInserts("INSERT INTO users (name) VALUES ('Ada')")[0].rows[0].name).toBe('Ada');
  });

  it('reads a backtick-quoted table and column', () => {
    const inserts = parseInserts("INSERT INTO `users` (`name`) VALUES ('Ada');");
    expect(inserts[0]).toMatchObject({ table: 'users', columns: ['name'] });
  });

  it('throws on an unterminated literal', () => {
    expect(() => parseInserts("INSERT INTO users (name) VALUES ('Ada")).toThrow(
      'Unterminated string literal'
    );
  });

  it('throws on an unterminated block comment', () => {
    expect(() => parseInserts('/* never closed\nINSERT INTO users (name) VALUES (1);')).toThrow(
      'Unterminated block comment'
    );
  });

  it('throws on an unterminated tuple', () => {
    expect(() => parseInserts("INSERT INTO users (name) VALUES ('Ada'")).toThrow(
      'Unterminated VALUES tuple'
    );
  });
});

describe('rowsFor', () => {
  it('returns the rows of every insert into the table', () => {
    const inserts = parseInserts(
      "INSERT INTO skills (skill) VALUES ('Go');INSERT INTO skills (skill) VALUES ('Rust');"
    );

    expect(rowsFor(inserts, 'skills')).toEqual([{ skill: 'Go' }, { skill: 'Rust' }]);
  });

  it('returns nothing for a table that is never inserted into', () => {
    expect(rowsFor(parseInserts("INSERT INTO skills (skill) VALUES ('Go');"), 'users')).toEqual([]);
  });
});
