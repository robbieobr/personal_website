import express from 'express';
import { getEducationByUser, createEducation, deleteEducation } from '../controllers/educationController';

const router = express.Router();

router.get('/user/:userId', getEducationByUser);
router.post('/', createEducation);
router.delete('/:id', deleteEducation);

export default router;
