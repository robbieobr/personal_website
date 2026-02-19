import { Request, Response } from 'express';
import { EducationModel } from '../models/index';

export const getEducationByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const education = await EducationModel.findByUserId(parseInt(userId));
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

    const educationId = await EducationModel.create({
      userId,
      institution,
      degree,
      field,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
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

    await EducationModel.delete(parseInt(id));
    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ error: 'Failed to delete education' });
  }
};
