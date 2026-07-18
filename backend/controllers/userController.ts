import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const generateToken = (id: number): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallbacksecret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please add all fields' });
      return;
    }

    // Check if user exists
    const userExistQuery = 'SELECT id FROM users WHERE email = $1';
    const userExist = await pool.query(userExistQuery, [email]);

    if (userExist.rows.length > 0) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const createUserQuery = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email';
    const newUser = await pool.query(createUserQuery, [name, email, hashedPassword]);

    const createdUser = newUser.rows[0];

    res.status(201).json({
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      token: generateToken(createdUser.id),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    // Check for user email
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userRes = await pool.query(userQuery, [email]);

    if (userRes.rows.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const user = userRes.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

// Retrieve all users (placeholder / debug)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const usersQuery = 'SELECT id, name, email FROM users';
    const usersRes = await pool.query(usersQuery);
    res.status(200).json(usersRes.rows);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
