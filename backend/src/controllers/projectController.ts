import { Request, Response } from 'express';
import { ProjectModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getProjectsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userIdNum = parseId(req.params.userId);
    if (userIdNum === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const projects = await ProjectModel.findByUserId(userIdNum);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};
