import { Request, Response } from 'express';
import { ContactInfoModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getContactInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseId(req.params.userId);
    if (userId === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const contactInfo = await ContactInfoModel.getByUserId(userId);
    res.json(contactInfo);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({ error: 'Failed to fetch contact info' });
  }
};
