import express from 'express';
import { getEducationByUser, createEducation, updateEducation, deleteEducation } from '../controllers/educationController';

const router = express.Router();

router.get('/user/:userId', getEducationByUser);
router.post('/', createEducation);
router.put('/:id', updateEducation);
router.delete('/:id', deleteEducation);

export default router;
