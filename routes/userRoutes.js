import express from 'express';
const router = express.Router();
import { getUserProfile, toggleFollow, getUserConnections, suggestedUsers } from '../controllers/userControllers.js';

router.get('/connections/:id', getUserConnections);
router.get('/profile/:id', getUserProfile);
router.get('/suggested', suggestedUsers);

// SINGLE TOGGLE ROUTE
router.post('/toggle-follow/:id', toggleFollow);

export default router;