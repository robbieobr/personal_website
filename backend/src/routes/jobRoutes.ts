import express from 'express';
import { getJobsByUser } from '../controllers/jobController';

const router = express.Router();

router.get('/user/:userId', getJobsByUser);

export default router;
