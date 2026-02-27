import { Request, Response } from 'express';
import { JobModel } from '../models/index';
import { parseId } from '../utils/parseId';
import { parseDate } from '../utils/parseDate';

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

export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, company, position, startDate, endDate, description } = req.body;

    if (!userId || !company || !position || !startDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const start = parseDate(startDate);
    if (start === null) {
      res.status(400).json({ error: 'Invalid start date' });
      return;
    }

    let end: Date | null = null;
    if (endDate) {
      end = parseDate(endDate);
      if (end === null) {
        res.status(400).json({ error: 'Invalid end date' });
        return;
      }
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

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const idNum = parseId(req.params.id);
    if (idNum === null) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    const { startDate, endDate, ...rest } = req.body;
    const updates: Record<string, unknown> = { ...rest };

    if (startDate !== undefined) {
      const start = parseDate(startDate);
      if (start === null) {
        res.status(400).json({ error: 'Invalid start date' });
        return;
      }
      updates.startDate = start;
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        updates.endDate = null;
      } else {
        const end = parseDate(endDate);
        if (end === null) {
          res.status(400).json({ error: 'Invalid end date' });
          return;
        }
        updates.endDate = end;
      }
    }

    const updated = await JobModel.update(idNum, updates);
    if (!updated) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const idNum = parseId(req.params.id);
    if (idNum === null) {
      res.status(400).json({ error: 'Invalid job ID' });
      return;
    }

    await JobModel.delete(idNum);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};
