const mysql2 = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const db = mysql2.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:            { ca: fs.readFileSync(path.join(__dirname, '../ca.pem')) },
  connectTimeout: 20000,
  waitForConnections: true,
  connectionLimit: 10,
});

db.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

module.exports = db;
