import { Request, Response } from 'express';
import { JobModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getJobsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdNum = parseId(req.params.userId);
    if (userIdNum === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const jobs = await JobModel.findByUserId(userIdNum);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

