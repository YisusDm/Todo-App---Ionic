import { Injectable } from '@angular/core';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

const STORAGE_KEY = 'todo_sqlite_db';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  color     TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id          TEXT    PRIMARY KEY,
  title       TEXT    NOT NULL,
  description TEXT,
  completed   INTEGER NOT NULL DEFAULT 0,
  categoryId  TEXT,
  dueDate     TEXT,
  sortOrder   INTEGER NOT NULL DEFAULT 0,
  createdAt   TEXT    NOT NULL,
  updatedAt   TEXT    NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_completed  ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_categoryId ON tasks(categoryId);
CREATE INDEX IF NOT EXISTS idx_tasks_sortOrder  ON tasks(sortOrder);
CREATE INDEX IF NOT EXISTS idx_tasks_dueDate    ON tasks(dueDate);
`;

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db!: Database;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const SQL: SqlJsStatic = await initSqlJs({
      locateFile: (file: string) => `assets/sql.js/${file}`,
    });

    const saved = this.loadBinary();
    this.db = saved ? new SQL.Database(saved) : new SQL.Database();
    this.db.run(SCHEMA_SQL);
    this.initialized = true;
  }

  run(sql: string, params: (string | number | null)[] = []): void {
    this.db.run(sql, params);
    this.persist();
  }

  // Wraps multiple statements in a single transaction and persists once.
  runBatch(statements: Array<{ sql: string; params?: (string | number | null)[] }>): void {
    this.db.run('BEGIN TRANSACTION');
    try {
      for (const s of statements) this.db.run(s.sql, s.params ?? []);
      this.db.run('COMMIT');
    } catch (err) {
      this.db.run('ROLLBACK');
      throw err;
    }
    this.persist();
  }

  query<T extends Record<string, unknown>>(
    sql: string,
    params: (string | number | null)[] = []
  ): T[] {
    const result = this.db.exec(sql, params);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(row =>
      columns.reduce<Record<string, unknown>>((obj, col, i) => {
        obj[col] = row[i];
        return obj;
      }, {})
    ) as T[];
  }

  private persist(): void {
    const data = this.db.export();
    const base64 = btoa(Array.from(data, b => String.fromCharCode(b)).join(''));
    localStorage.setItem(STORAGE_KEY, base64);
  }

  private loadBinary(): Uint8Array | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const binary = atob(stored);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  }
}
