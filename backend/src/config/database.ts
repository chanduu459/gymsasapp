import 'dotenv/config';
import { Pool } from 'pg';

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gymsaas',
    });

export default pool;

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Database connection verified successfully');
  } finally {
    client.release();
  }
}
