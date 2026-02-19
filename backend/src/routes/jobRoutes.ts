import express from 'express';
import { getJobsByUser, createJob, deleteJob } from '../controllers/jobController';

const router = express.Router();

router.get('/user/:userId', getJobsByUser);
router.post('/', createJob);
router.delete('/:id', deleteJob);

export default router;
