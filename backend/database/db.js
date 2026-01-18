const { Pool } = require('pg');
require('dotenv').config();

// Sukuriame connection pool
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Klaida prisijungiant prie duombazės:', err.stack);
  }
  console.log('✅ Prisijungta prie PostgreSQL duombazės!');
  console.log('Database connected successfully');
  release();
});

module.exports = pool;