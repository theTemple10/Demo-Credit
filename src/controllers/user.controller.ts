import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import UserModel from '../models/UserModel';
import WalletModel from '../models/WalletModel';
import karmaCheck from '../services/karma.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password, phone_number, bvn } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !phone_number || !bvn) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if email already exists
    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    // Check if phone already exists
    const existingPhone = await UserModel.findByPhone(phone_number);
    if (existingPhone) {
      res.status(409).json({ message: 'Phone number already in use' });
      return;
    }

    // Check Adjutor Karma blacklist
    const isBlacklisted = await karmaCheck(email);
    if (isBlacklisted) {
      res.status(403).json({ message: 'Account creation not allowed' });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const [userId] = await UserModel.create({
      full_name,
      email,
      password: hashedPassword,
      phone_number,
      bvn,
    });

    // Automatically create a wallet for the new user
    await WalletModel.create(userId);

    // Fetch the created user to return (without password)
    const user = await UserModel.findById(userId);

    res.status(201).json({
      message: 'Account created successfully',
      data: {
        id: user!.id,
        full_name: user!.full_name,
        email: user!.email,
        phone_number: user!.phone_number,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating account' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find the user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Return the user's ID as the faux token
    res.status(200).json({
      message: 'Login successful',
      data: {
        token: String(user.id),
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const wallet = await WalletModel.findByUserId(user.id!);

    res.status(200).json({
      data: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        is_active: user.is_active,
        wallet: {
          id: wallet!.id,
          balance: wallet!.balance,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};