import express from 'express';
import { getUser, getAllUsers, getUserProfile, createUser, updateUser, deleteUser } from '../controllers/userController';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id/profile', getUserProfile);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
