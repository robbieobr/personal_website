import { Request, Response } from 'express';
import { EducationModel } from '../models/index';

export const getEducationByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
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

export const createEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, institution, degree, field, startDate, endDate, description } = req.body;

    if (!userId || !institution || !degree || !field || !startDate) {
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

    const educationId = await EducationModel.create({
      userId,
      institution,
      degree,
      field,
      startDate: start,
      endDate: end,
      description: description || null,
    });

    res.status(201).json({ id: educationId, message: 'Education created successfully' });
  } catch (error) {
    console.error('Error creating education:', error);
    res.status(500).json({ error: 'Failed to create education' });
  }
};

export const deleteEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      res.status(400).json({ error: 'Invalid education ID' });
      return;
    }

    await EducationModel.delete(idNum);
    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ error: 'Failed to delete education' });
  }
};
