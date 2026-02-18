import express from 'express';
const router = express.Router();

import {login,register,getAllUsers,updateProfile,googleLoginTrigger,googleCallback,getPublicProfile} from '../controllers/authControllers.js';

router.post('/register',register);
router.post('/login',login );
router.get('/all-users/:myId', getAllUsers);
router.put('/update-profile',updateProfile);
router.get('/google',googleLoginTrigger)
router.get('/google/callback',googleCallback)
// Add this line
router.get('/me/:id', getPublicProfile); // We can reuse getPublicProfile or create getMe
export default router;

