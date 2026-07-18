import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export interface ProtectRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export const protect = async (req: ProtectRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret') as { id: number };

      const userQuery = 'SELECT id, name, email FROM users WHERE id = $1';
      const userRes = await pool.query(userQuery, [decoded.id]);

      if (userRes.rows.length === 0) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      req.user = userRes.rows[0];
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};
