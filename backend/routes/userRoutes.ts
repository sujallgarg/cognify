import express from 'express';
import { getUsers, registerUser, loginUser } from '../controllers/userController.js';

const router = express.Router();

// Route for getting all users (debug) and registering a new user
// router.route('/')
//     .get(getUsers)
//     .post(registerUser);

// Route for authenticating/logging in a user
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
