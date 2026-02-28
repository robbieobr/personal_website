import express from 'express';
import { getEducationByUser } from '../controllers/educationController';

const router = express.Router();

router.get('/user/:userId', getEducationByUser);

export default router;
