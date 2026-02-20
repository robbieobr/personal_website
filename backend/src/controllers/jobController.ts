import { Request, Response } from 'express';
import { JobModel } from '../models/index';

export const getJobsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
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

export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, company, position, startDate, endDate, description } = req.body;

    if (!userId || !company || !position || !startDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      res.status(400).json({ error: 'Invalid start date' });
      return;
    }

    let end: Date | null = null;
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        res.status(400).json({ error: 'Invalid end date' });
        return;
      }
      end = parsedEnd;
    }

    const jobId = await JobModel.create({
      userId,
      company,
      position,
      startDate: start,
      endDate: end,
      description: description || null,
    });

    res.status(201).json({ id: jobId, message: 'Job created successfully' });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await JobModel.delete(parseInt(id));
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};
