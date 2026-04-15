import db from '../database/db';

export interface Wallet {
  id?: number;
  user_id: number;
  balance: number;
  created_at?: Date;
  updated_at?: Date;
}

const WalletModel = {
  async create(user_id: number): Promise<number[]> {
    return db('wallets').insert({ user_id, balance: 0.00 });
  },

  async findByUserId(user_id: number): Promise<Wallet | undefined> {
    return db('wallets').where({ user_id }).first();
  },

  async findById(id: number): Promise<Wallet | undefined> {
    return db('wallets').where({ id }).first();
  },

  async updateBalance(id: number, balance: number): Promise<number> {
    return db('wallets').where({ id }).update({ balance });
  },
};

export default WalletModel;