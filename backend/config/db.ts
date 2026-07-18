import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`PostgreSQL Connected`);
    
    // Auto-create users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createTableQuery);

    // Dynamic migration: Ensure columns exist if table already existed previously
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    client.release();
    console.log('Users table verified and migrated');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred while connecting to PostgreSQL');
    }
    process.exit(1);
  }
};

export default connectDB;
