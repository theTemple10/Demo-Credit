import db from '../database/db';

export interface Transaction {
  id?: number;
  wallet_id: number;
  type: 'credit' | 'debit';
  amount: number;
  reference: string;
  status?: 'pending' | 'successful' | 'failed';
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

const TransactionModel = {
  async create(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    return db('transactions').insert(transactionData);
  },

  async findByWalletId(wallet_id: number): Promise<Transaction[]> {
    return db('transactions').where({ wallet_id }).orderBy('created_at', 'desc');
  },

  async findByReference(reference: string): Promise<Transaction | undefined> {
    return db('transactions').where({ reference }).first();
  },
};

export default TransactionModel;