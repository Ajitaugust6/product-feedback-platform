import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res): Promise<any> => {
  try {
    const { email, username, password } = req.body;

    // 1. Check if user exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // 2. Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert new user (CHANGED user_role to role)
    const newUser = await pool.query(
      `INSERT INTO users (email, username, password_hash) 
       VALUES ($1, $2, $3) RETURNING user_id, email, username, role`,
      [email, username, passwordHash]
    );

    // 4. Generate JWT (CHANGED user_role to role)
    const token = jwt.sign(
      { user_id: newUser.rows[0].user_id, role: newUser.rows[0].role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      status: 'success',
      data: { user: newUser.rows[0], token }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error during registration' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // 2. Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // 3. Generate JWT (CHANGED user_role to role)
    const token = jwt.sign(
      { user_id: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          user_id: user.rows[0].user_id,
          username: user.rows[0].username,
          role: user.rows[0].role // <--- THE BUG IS SQUASHED!
        },
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error during login' });
  }
});

export default router;