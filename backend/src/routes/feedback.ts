import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { isAdmin } from '../middleware/adminAuth';

const router = express.Router();

// POST /api/v1/feedback - Submit new feedback
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, description, category_id } = req.body;
    const user_id = req.user.user_id;
    const creator_ip = req.ip || '127.0.0.1';

    if (!title || title.length < 5 || title.length > 150) {
      return res.status(400).json({ status: 'error', message: 'Title must be 5-150 characters' });
    }
    if (!description || description.length < 20 || description.length > 2000) {
      return res.status(400).json({ status: 'error', message: 'Description must be 20-2000 characters' });
    }

    const newPost = await pool.query(
      `INSERT INTO feedback_posts (user_id, title, description, category_id, creator_ip) 
       VALUES ($1, $2, $3, $4, $5) RETURNING post_id, created_at`,
      [user_id, title, description, category_id || null, creator_ip]
    );

    res.status(201).json({
      status: 'success',
      data: newPost.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to create feedback' });
  }
});

// GET /api/v1/feedback - Get paginated feedback list with filtering & search
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, per_page = 10, sort_by = 'most_voted', status, search, category_id } = req.query;
    const offset = (Number(page) - 1) * Number(per_page);
    
    let orderBy = 'p.upvote_count DESC';
    if (sort_by === 'newest') orderBy = 'p.created_at DESC';
    if (sort_by === 'recently_updated') orderBy = 'p.updated_at DESC';
    if (sort_by === 'least_voted') orderBy = 'p.upvote_count ASC';

    // Dynamic WHERE clauses for PostgreSQL
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (status && status !== 'All') {
      whereClauses.push(`p.status = $${paramIdx++}`);
      queryParams.push((status as string).toLowerCase().replace(/\s+/g, '_'));
    }

    if (category_id && category_id !== 'All') {
      whereClauses.push(`p.category_id = $${paramIdx++}`);
      queryParams.push(Number(category_id));
    }

    if (search && (search as string).trim() !== '') {
      whereClauses.push(`(p.title ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      queryParams.push(`%${(search as string).trim()}%`);
      paramIdx++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const postsQuery = `
      SELECT p.post_id, p.title, p.description, p.status, p.upvote_count, 
             p.admin_priority_rating, p.created_at, p.admin_response, p.category_id,
             u.username as creator_username, c.category_name
      FROM feedback_posts p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ${whereString}
      ORDER BY ${orderBy}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM feedback_posts p
      ${whereString}
    `;

    const [posts, totalCount] = await Promise.all([
      pool.query(postsQuery, [...queryParams, Number(per_page), offset]),
      pool.query(countQuery, queryParams)
    ]);

    const total_items = parseInt(totalCount.rows[0].count || '0');
    const total_pages = Math.ceil(total_items / Number(per_page));

    res.status(200).json({
      status: 'success',
      data: {
        feedback_posts: posts.rows,
        pagination: {
          current_page: Number(page),
          total_pages,
          total_items
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch feedback' });
  }
});

// POST /api/v1/feedback/:post_id/vote - Toggle upvote
router.post('/:post_id/vote', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const client = await pool.connect();
  try {
    const post_id = req.params.post_id;
    const user_id = req.user.user_id;

    await client.query('BEGIN');

    const existingVote = await client.query(
      'SELECT * FROM votes WHERE user_id = $1 AND post_id = $2',
      [user_id, post_id]
    );

    let newUpvoteCount = 0;
    let userHasVoted = false;

    if (existingVote.rows.length > 0) {
      await client.query('DELETE FROM votes WHERE user_id = $1 AND post_id = $2', [user_id, post_id]);
      const updateRes = await client.query(
        'UPDATE feedback_posts SET upvote_count = upvote_count - 1 WHERE post_id = $1 RETURNING upvote_count',
        [post_id]
      );
      newUpvoteCount = updateRes.rows[0].upvote_count;
      userHasVoted = false;
    } else {
      await client.query('INSERT INTO votes (user_id, post_id) VALUES ($1, $2)', [user_id, post_id]);
      const updateRes = await client.query(
        'UPDATE feedback_posts SET upvote_count = upvote_count + 1 WHERE post_id = $1 RETURNING upvote_count',
        [post_id]
      );
      newUpvoteCount = updateRes.rows[0].upvote_count;
      userHasVoted = true;
    }

    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      data: {
        post_id: parseInt(post_id),
        new_upvote_count: newUpvoteCount,
        user_has_voted: userHasVoted
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Failed to toggle vote' });
  } finally {
    client.release();
  }
});

// PATCH /api/v1/feedback/:post_id/admin - Admin Update Route (Updates status, response, & priority rating)
router.patch('/:post_id/admin', authenticateToken, isAdmin, async (req: AuthRequest, res: Response): Promise<any> => {
  const { post_id } = req.params;
  const { status, admin_response, admin_priority_rating } = req.body;

  try {
    const result = await pool.query(
      `UPDATE feedback_posts 
       SET status = $1, admin_response = $2, admin_priority_rating = $3, updated_at = NOW() 
       WHERE post_id = $4 
       RETURNING *;`,
      [status, admin_response, admin_priority_rating || null, post_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Feedback not found.' });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
      message: 'Admin response saved!'
    });
  } catch (error) {
    console.error('Admin Update Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save admin response.' });
  }
});

export default router;