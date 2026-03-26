const mysql2 = require("mysql2/promise");

const db = mysql2.createPool({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "ko_dining",
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = db;
