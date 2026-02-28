import express from 'express';
import { getAchievementsByUser } from '../controllers/achievementController';

const router = express.Router();

router.get('/user/:userId', getAchievementsByUser);

export default router;
