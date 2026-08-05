import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include our user payload
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Get the token from the "Authorization: Bearer <token>" header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ 
      status: 'error', 
      message: 'Access denied. No authentication token provided.' 
    });
    return;
  }

  try {
    // Verify the token using the secret in your .env file
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // Attach the decoded payload (like user_id) to the request
    next(); // Pass control to the next route handler
  } catch (error) {
    res.status(403).json({ 
      status: 'error', 
      message: 'Invalid or expired token.' 
    });
  }
};