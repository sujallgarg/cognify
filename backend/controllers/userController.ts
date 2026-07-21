import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { sendEmail } from '../config/mailer.js';

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

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const userExistQuery = 'SELECT id FROM users WHERE LOWER(TRIM(email)) = $1';
    const userExist = await pool.query(userExistQuery, [cleanEmail]);

    if (userExist.rows.length > 0) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const createUserQuery = 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email';
    const newUser = await pool.query(createUserQuery, [name.trim(), cleanEmail, hashedPassword]);

    const createdUser = newUser.rows[0];

    // Send welcome email
    try {
      await sendEmail({
        to: createdUser.email,
        subject: '🎉 Welcome to Cognify AI!',
        text: `Hi ${createdUser.name},\n\nWelcome to Cognify! We're thrilled to have you here.\n\nStart monitoring page changes in your workspace: ${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/dashboard`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #fafafa; text-align: left;">
            <h2 style="color: #000; margin-top: 0; font-size: 20px;">🎉 Welcome to Cognify AI!</h2>
            <p>Hi <strong>${createdUser.name}</strong>,</p>
            <p>Thank you for creating an account with Cognify. We are thrilled to help you track webpage changes and automate competitor intelligence monitors in real-time!</p>
            <p>Here are a few quick tips to get started:</p>
            <ul style="padding-left: 20px; line-height: 1.6; font-size: 13px;">
              <li>Use the <strong>Quick Monitor</strong> on your dashboard to add webpage URLs.</li>
              <li>Configure <strong>Slack and Discord alerts</strong> in settings for immediate updates.</li>
              <li>Toggle <strong>Email Notifications</strong> to get visual diffs delivered straight to your inbox.</li>
            </ul>
            <p style="margin-top: 20px;">Click the button below to log in and access your workspace:</p>
            <a href="${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 18px; color: #fff; background-color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Access Workspace</a>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 11px; color: #71717a; margin-bottom: 0;">If you have any questions, simply reply to this email. We're here to help.</p>
          </div>
        `
      });
    } catch (mailErr) {
      console.error('Welcome email failed to send:', mailErr);
    }

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

    const cleanEmail = email.trim().toLowerCase();

    // Check for user email
    const userQuery = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = $1';
    const userRes = await pool.query(userQuery, [cleanEmail]);

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

// @desc    Update user profile (name, email)
// @route   PUT /api/users/profile
// @access  Public (unprotected placeholder/simplistic setup for now)
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const { currentEmail, name, email } = req.body;

  if (!currentEmail || !name || !email) {
    res.status(400).json({ message: 'Current email, name, and new email are required' });
    return;
  }

  try {
    // If updating email, check if new email already exists
    if (email.toLowerCase() !== currentEmail.toLowerCase()) {
      const emailExist = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailExist.rows.length > 0) {
        res.status(400).json({ message: 'New email address is already in use.' });
        return;
      }
    }

    // Update user
    const updateQuery = 'UPDATE users SET name = $1, email = $2 WHERE email = $3 RETURNING id, name, email';
    const updated = await pool.query(updateQuery, [name, email, currentEmail]);

    if (updated.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Cascade update to monitored channels and scan history
    await pool.query('UPDATE channels SET user_email = $1 WHERE user_email = $2', [email, currentEmail]);
    await pool.query('UPDATE scan_history SET user_email = $1 WHERE user_email = $2', [email, currentEmail]);

    res.json(updated.rows[0]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};
