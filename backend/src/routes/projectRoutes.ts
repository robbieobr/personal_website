import express from 'express';
import { getProjectsByUser } from '../controllers/projectController';

const router = express.Router();

router.get('/user/:userId', getProjectsByUser);

export default router;
