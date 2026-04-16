import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import WalletModel from '../models/WalletModel';
import TransactionModel from '../models/TransactionModel';
import generateReference from '../utils/generateReference';

export const fundWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      res.status(400).json({ message: 'Valid amount is required' });
      return;
    }

    // Get the user's wallet
    const wallet = await WalletModel.findByUserId(req.user!.id);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const fundAmount = Number(amount);
    const newBalance = Number(wallet.balance) + fundAmount;

    // Update the balance
    await WalletModel.updateBalance(wallet.id!, newBalance);

    // Record the transaction
    await TransactionModel.create({
      wallet_id: wallet.id!,
      type: 'credit',
      amount: fundAmount,
      reference: generateReference(),
      description: 'Wallet funding',
    });

    res.status(200).json({
      message: 'Wallet funded successfully',
      data: { new_balance: newBalance },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error funding wallet' });
  }
};

export const transferFunds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipient_email, amount } = req.body;

    if (!recipient_email || !amount || isNaN(amount) || Number(amount) <= 0) {
      res.status(400).json({ message: 'Recipient email and valid amount are required' });
      return;
    }

    const transferAmount = Number(amount);

    // Get sender's wallet
    const senderWallet = await WalletModel.findByUserId(req.user!.id);
    if (!senderWallet) {
      res.status(404).json({ message: 'Sender wallet not found' });
      return;
    }

    // Check sufficient balance
    if (Number(senderWallet.balance) < transferAmount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    // Prevent self-transfer
    if (req.user!.email === recipient_email) {
      res.status(400).json({ message: 'Cannot transfer to yourself' });
      return;
    }

    // Find recipient's wallet
    const { default: UserModel } = await import('../models/UserModel');
    const recipient = await UserModel.findByEmail(recipient_email);
    if (!recipient) {
      res.status(404).json({ message: 'Recipient not found' });
      return;
    }

    const recipientWallet = await WalletModel.findByUserId(recipient.id!);
    if (!recipientWallet) {
      res.status(404).json({ message: 'Recipient wallet not found' });
      return;
    }

    // Generate one shared reference for both transaction records
    const reference = generateReference();

    // Deduct from sender
    const senderNewBalance = Number(senderWallet.balance) - transferAmount;
    await WalletModel.updateBalance(senderWallet.id!, senderNewBalance);
    await TransactionModel.create({
      wallet_id: senderWallet.id!,
      type: 'debit',
      amount: transferAmount,
      reference: `${reference}-OUT`,
      description: `Transfer to ${recipient_email}`,
    });

    // Credit recipient
    const recipientNewBalance = Number(recipientWallet.balance) + transferAmount;
    await WalletModel.updateBalance(recipientWallet.id!, recipientNewBalance);
    await TransactionModel.create({
      wallet_id: recipientWallet.id!,
      type: 'credit',
      amount: transferAmount,
      reference: `${reference}-IN`,
      description: `Transfer from ${req.user!.email}`,
    });

    res.status(200).json({
      message: 'Transfer successful',
      data: { new_balance: senderNewBalance },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing transfer' });
  }
};

export const withdrawFunds = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      res.status(400).json({ message: 'Valid amount is required' });
      return;
    }

    const withdrawAmount = Number(amount);

    // Get wallet
    const wallet = await WalletModel.findByUserId(req.user!.id);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    // Check sufficient balance
    if (Number(wallet.balance) < withdrawAmount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    // Deduct and record
    const newBalance = Number(wallet.balance) - withdrawAmount;
    await WalletModel.updateBalance(wallet.id!, newBalance);
    await TransactionModel.create({
      wallet_id: wallet.id!,
      type: 'debit',
      amount: withdrawAmount,
      reference: generateReference(),
      description: 'Withdrawal',
    });

    res.status(200).json({
      message: 'Withdrawal successful',
      data: { new_balance: newBalance },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallet = await WalletModel.findByUserId(req.user!.id);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const transactions = await TransactionModel.findByWalletId(wallet.id!);

    res.status(200).json({ data: transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};