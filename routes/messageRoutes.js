import express from 'express';
const router = express.Router();
import {deleteMessage, getUserMessages,sendMessage} from '../controllers/messageController.js';


router.get('/:myId/:partnerId', getUserMessages);
router.post('/send/:id',sendMessage);
router.delete('/:id', deleteMessage);
export default router;