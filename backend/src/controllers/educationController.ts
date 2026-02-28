import { Request, Response } from 'express';
import { EducationModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getEducationByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdNum = parseId(req.params.userId);
    if (userIdNum === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const education = await EducationModel.findByUserId(userIdNum);
    res.json(education);
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ error: 'Failed to fetch education' });
  }
};

