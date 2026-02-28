import express from 'express';
import { getSkillsByUser } from '../controllers/skillController';

const router = express.Router();

router.get('/user/:userId', getSkillsByUser);

export default router;
