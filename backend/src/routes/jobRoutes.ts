import express from 'express';
import { getJobsByUser, createJob, updateJob, deleteJob } from '../controllers/jobController';

const router = express.Router();

router.get('/user/:userId', getJobsByUser);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
