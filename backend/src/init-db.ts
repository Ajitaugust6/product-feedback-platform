import fs from 'fs';
import path from 'path';
import pool from './db';

const initDB = async () => {
  try {
    const sqlPath = path.join(__dirname, '../schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ Database tables and indexes created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
};

initDB();