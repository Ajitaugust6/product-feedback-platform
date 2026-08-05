import express, { Response, NextFunction } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Middleware to check for Admin role
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ status: 'error', message: 'Forbidden. Admin access required.' });
    return;
  }
  next();
};

// PATCH /api/v1/admin/feedback/:post_id - Update status, priority, and respond
router.patch('/feedback/:post_id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
  const client = await pool.connect();
  try {
    const { post_id } = req.params;
    const { status, admin_priority_rating, response_text } = req.body;
    const admin_id = req.user.user_id;

    await client.query('BEGIN');

    // 1. Update the feedback post status & priority
    const updatedPost = await client.query(
      `UPDATE feedback_posts 
       SET status = COALESCE($1, status), 
           admin_priority_rating = COALESCE($2, admin_priority_rating),
           updated_at = NOW()
       WHERE post_id = $3
       RETURNING post_id, status, admin_priority_rating`,
      [status, admin_priority_rating, post_id]
    );

    if (updatedPost.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Feedback post not found' });
    }

    // 2. Add an Official Response if text was provided
    let new_response_id = null;
    if (response_text) {
      const responseRes = await client.query(
        `INSERT INTO official_responses (post_id, admin_id, response_text)
         VALUES ($1, $2, $3)
         RETURNING response_id`,
        [post_id, admin_id, response_text]
      );
      new_response_id = responseRes.rows[0].response_id;
    }

    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      data: {
        post_id: parseInt(post_id),
        updated_status: updatedPost.rows[0].status,
        updated_rating: updatedPost.rows[0].admin_priority_rating,
        new_response_id
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to update feedback' });
  } finally {
    client.release();
  }
});

export default router;