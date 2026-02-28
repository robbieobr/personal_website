import { Request, Response } from 'express';
import { AchievementModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getAchievementsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdNum = parseId(req.params.userId);
    if (userIdNum === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const achievements = await AchievementModel.findByUserId(userIdNum);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};
