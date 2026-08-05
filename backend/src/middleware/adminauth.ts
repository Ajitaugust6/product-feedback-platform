import { Response, NextFunction } from 'express';
import pool from '../db';
import { AuthRequest } from './auth';

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Notice we use req.user.user_id matching your schema
    const userId = req.user.user_id; 

    const result = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);
    
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Access Denied: Admins only.' });
    }

    next(); // They are an admin!
  } catch (error) {
    console.error('Admin Auth Error:', error);
    res.status(500).json({ status: 'error', message: 'Server error checking admin status.' });
  }
};