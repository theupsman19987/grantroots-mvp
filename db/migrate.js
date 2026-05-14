/**
 * Minimal migration runner.
 * Usage:  node db/migrate.js
 *
 * Reads schema.sql and applies it against DATABASE_URL.
 * Safe to run multiple times — all DDL uses IF NOT EXISTS.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

async function migrate() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Running schema migration...');
  try {
    await client.query(sql);
    console.log('✓ Migration complete');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
