import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/UserModel';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // This is a faux token token to be the user's id
    // In a real app this would be a JWT verification
    const userId = parseInt(token);

    if (isNaN(userId)) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = { id: user.id!, email: user.email };
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authentication error' });
  }
};

export default authMiddleware;