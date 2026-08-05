import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';
import authRoutes from './routes/auth'; 
import feedbackRoutes from './routes/feedback';
import categoriesRoutes from './routes/categories';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy and connected to DB!',
      timestamp: dbResult.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});