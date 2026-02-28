import express from 'express';
import { getUser, getAllUsers, getUserProfile } from '../controllers/userController';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id/profile', getUserProfile);
router.get('/:id', getUser);

export default router;
