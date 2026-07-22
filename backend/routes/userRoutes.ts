import express from 'express';
import { getUsers, registerUser, loginUser, updateUserProfile, getUserSettings, updateUserSettings } from '../controllers/userController.js';

const router = express.Router();

// Route for authenticating/logging in a user
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', updateUserProfile);
router.get('/settings', getUserSettings);
router.post('/settings', updateUserSettings);

export default router;
