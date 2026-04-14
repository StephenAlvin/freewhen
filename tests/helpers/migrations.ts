// Raw-imported SQL so this helper works inside the Workers runtime
// (node fs APIs like readdirSync/readFileSync are not available there).
import migration0001 from '../../migrations/0001_init.sql?raw';

const MIGRATIONS: { name: string; sql: string }[] = [
  { name: '0001_init.sql', sql: migration0001 },
];

export async function applyMigrations(db: D1Database) {
  for (const { sql } of MIGRATIONS) {
    const statements = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    for (const s of statements) {
      await db.prepare(s).run();
    }
  }
}
