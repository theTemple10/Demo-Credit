import { Router } from 'express';
import {
  fundWallet,
  transferFunds,
  withdrawFunds,
  getTransactions,
} from '../controllers/wallet.controller';
import authMiddleware from '../middlewares/auth.middleware';

const router = Router();

router.post('/fund', authMiddleware, fundWallet);
router.post('/transfer', authMiddleware, transferFunds);
router.post('/withdraw', authMiddleware, withdrawFunds);
router.get('/transactions', authMiddleware, getTransactions);

export default router;