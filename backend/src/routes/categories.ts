import express, { Request, Response } from 'express';
import pool from '../db';

const router = express.Router();

// GET /api/v1/categories - Fetch all active categories
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const categories = await pool.query(
      'SELECT category_id, category_name, color_code FROM categories WHERE is_active = true ORDER BY display_order ASC'
    );
    
    res.status(200).json({
      status: 'success',
      data: { categories: categories.rows }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
});

export default router;