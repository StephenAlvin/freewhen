import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function applyMigrations(db: D1Database) {
  const dir = join(process.cwd(), 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = readFileSync(join(dir, f), 'utf8');
    const statements = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    for (const s of statements) {
      await db.prepare(s).run();
    }
  }
}
