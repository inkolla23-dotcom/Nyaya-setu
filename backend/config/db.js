import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let sslConfig = undefined;

if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST))) {
  sslConfig = {};
  if (process.env.DB_SSL_CA) {
    sslConfig.ca = process.env.DB_SSL_CA;
  } else {
    sslConfig.rejectUnauthorized = false;
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Indhu@230907',
  database: process.env.DB_NAME || 'nyaya_setu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig
});

export default pool;
