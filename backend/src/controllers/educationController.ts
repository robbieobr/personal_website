import { Request, Response } from 'express';
import { EducationModel } from '../models/index';
import { parseId } from '../utils/parseId';
import { parseDate } from '../utils/parseDate';

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

export const createEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, institution, degree, field, startDate, endDate, description } = req.body;

    if (!userId || !institution || !degree || !field || !startDate) {
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

export const updateEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const idNum = parseId(req.params.id);
    if (idNum === null) {
      res.status(400).json({ error: 'Invalid education ID' });
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

    const updated = await EducationModel.update(idNum, updates);
    if (!updated) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    res.json({ message: 'Education updated successfully' });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ error: 'Failed to update education' });
  }
};

export const deleteEducation = async (req: Request, res: Response): Promise<void> => {
  try {
    const idNum = parseId(req.params.id);
    if (idNum === null) {
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
