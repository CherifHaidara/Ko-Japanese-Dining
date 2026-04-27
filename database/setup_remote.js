const mysql2 = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { ca: fs.readFileSync(path.join(__dirname, '../ca.pem')) },
    connectTimeout: 20000,
    multipleStatements: true,
  });

  const files = ['menu_setup.sql', 'orders_setup.sql', 'reservations_setup.sql'];

  for (const file of files) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/USE\s+ko_dining\s*;/gi, '');
    console.log(`Running ${file}...`);
    await conn.query(sql);
    console.log(`Done.`);
  }

  await conn.end();
  console.log('All tables created.');
}

main().catch(err => console.error('Error:', err.message));
