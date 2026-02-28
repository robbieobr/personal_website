import { Request, Response } from 'express';
import { UserModel, JobModel, EducationModel, ProjectModel, SkillModel, AchievementModel, ContactInfoModel } from '../models/index';
import { parseId } from '../utils/parseId';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseId(req.params.id);
    if (userId === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseId(req.params.id);
    if (userId === null) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [contactInfo, jobHistory, education, projects, skills, achievements] = await Promise.all([
      ContactInfoModel.getByUserId(userId),
      JobModel.findByUserId(userId),
      EducationModel.findByUserId(userId),
      ProjectModel.findByUserId(userId),
      SkillModel.findByUserId(userId),
      AchievementModel.findByUserId(userId),
    ]);

    res.json({
      user,
      contactInfo,
      jobHistory,
      education,
      projects,
      skills,
      achievements,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

