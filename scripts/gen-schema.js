const { execSync } = require("child_process");
const fs = require("fs");
fs.mkdirSync("artifacts",{recursive:true});
try {
  if (process.env.DATABASE_URL && /^postgres/i.test(process.env.DATABASE_URL)) {
    execSync(`pg_dump -s "$DATABASE_URL" > artifacts/schema.sql`, {stdio:"inherit",shell:"bash"});
    console.log("✓ DB: wrote Postgres schema to artifacts/schema.sql");
    process.exit(0);
  }
} catch(e) {
  console.error("pg_dump failed; trying SQLite…");
}
const db = ["xpress_ops.db","database/xpress_ops.db"].find(p=>fs.existsSync(p));
if (db) {
  try {
    execSync(`sqlite3 "${db}" ".schema" > artifacts/schema.sql`, {stdio:"inherit",shell:"bash"});
    console.log("✓ DB: wrote SQLite schema to artifacts/schema.sql");
    process.exit(0);
  } catch {}
}
console.log("SKIP DB: No DATABASE_URL (pg) and no .db file found; not producing schema.sql");
