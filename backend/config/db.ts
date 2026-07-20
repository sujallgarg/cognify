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

    // Auto-create channels table
    const createChannelsTableQuery = `
      CREATE TABLE IF NOT EXISTS channels (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        interval VARCHAR(50) NOT NULL,
        last_text TEXT DEFAULT '',
        original_text TEXT DEFAULT '',
        alert_type VARCHAR(50) DEFAULT '',
        alert_desc TEXT DEFAULT '',
        last_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(createChannelsTableQuery);
    await client.query('ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // Auto-create scan_history table
    const createScanHistoryTableQuery = `
      CREATE TABLE IF NOT EXISTS scan_history (
        id SERIAL PRIMARY KEY,
        channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        user_email VARCHAR(100) NOT NULL,
        scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status_type VARCHAR(50) NOT NULL,
        description TEXT DEFAULT '',
        original_text TEXT DEFAULT '',
        changed_text TEXT DEFAULT '',
        explanation TEXT DEFAULT ''
      );
    `;
    await client.query(createScanHistoryTableQuery);

    client.release();
    console.log('Database tables verified and migrated');
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
