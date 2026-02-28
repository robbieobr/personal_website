import express from 'express';
import { getContactInfo } from '../controllers/contactInfoController';

const router = express.Router();

router.get('/:userId', getContactInfo);

export default router;
