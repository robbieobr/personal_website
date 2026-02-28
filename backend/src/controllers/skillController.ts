import { Request, Response } from 'express';
import { SkillModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getSkillsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdNum = parseId(req.params.userId);
    if (userIdNum === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const skills = await SkillModel.findByUserId(userIdNum);
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
};
