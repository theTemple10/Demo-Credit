import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import WalletModel from '../models/WalletModel';
import TransactionModel from '../models/TransactionModel';
import UserModel from '../models/UserModel';
import { randomBytes } from 'crypto';
import db from '../database/db';

const generateReference = (): string => {
  return `TXN-${randomBytes(16).toString('hex')}`;
};

export const fundWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      res.status(400).json({ message: 'Valid amount is required' });
      return;
    }

    const wallet = await WalletModel.findByUserId(req.user!.id);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    const fundAmount = Number(amount);
    const newBalance = Number(wallet.balance) + fundAmount;

    await db.transaction(async (trx) => {
      await trx('wallets').where({ id: wallet.id }).update({ balance: newBalance });
      await trx('transactions').insert({
        wallet_id: wallet.id,
        type: 'credit',
        amount: fundAmount,
        reference: generateReference(),
        status: 'successful',
        description: 'Wallet funding',
      });
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

    if (req.user!.email === recipient_email.trim().toLowerCase()) {
      res.status(400).json({ message: 'Cannot transfer to yourself' });
      return;
    }

    const senderWallet = await WalletModel.findByUserId(req.user!.id);
    if (!senderWallet) {
      res.status(404).json({ message: 'Sender wallet not found' });
      return;
    }

    if (Number(senderWallet.balance) < transferAmount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    const recipient = await UserModel.findByEmail(recipient_email.trim().toLowerCase());
    if (!recipient) {
      res.status(404).json({ message: 'Recipient not found' });
      return;
    }

    const recipientWallet = await WalletModel.findByUserId(recipient.id!);
    if (!recipientWallet) {
      res.status(404).json({ message: 'Recipient wallet not found' });
      return;
    }

    const reference = generateReference();
    const senderNewBalance = Number(senderWallet.balance) - transferAmount;
    const recipientNewBalance = Number(recipientWallet.balance) + transferAmount;

    await db.transaction(async (trx) => {
      await trx('wallets').where({ id: senderWallet.id }).update({ balance: senderNewBalance });
      await trx('transactions').insert({
        wallet_id: senderWallet.id,
        type: 'debit',
        amount: transferAmount,
        reference: `${reference}-OUT`,
        status: 'successful',
        description: `Transfer to ${recipient_email}`,
      });

      await trx('wallets').where({ id: recipientWallet.id }).update({ balance: recipientNewBalance });
      await trx('transactions').insert({
        wallet_id: recipientWallet.id,
        type: 'credit',
        amount: transferAmount,
        reference: `${reference}-IN`,
        status: 'successful',
        description: `Transfer from ${req.user!.email}`,
      });
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

    const wallet = await WalletModel.findByUserId(req.user!.id);
    if (!wallet) {
      res.status(404).json({ message: 'Wallet not found' });
      return;
    }

    if (Number(wallet.balance) < withdrawAmount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }

    const newBalance = Number(wallet.balance) - withdrawAmount;

    await db.transaction(async (trx) => {
      await trx('wallets').where({ id: wallet.id }).update({ balance: newBalance });
      await trx('transactions').insert({
        wallet_id: wallet.id,
        type: 'debit',
        amount: withdrawAmount,
        reference: generateReference(),
        status: 'successful',
        description: 'Withdrawal',
      });
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