import db from '../database/db';

export interface User {
  id?: number;
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  bvn: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

const UserModel = {
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number[]> {
    return db('users').insert(userData);
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return db('users').where({ email }).first();
  },

  async findById(id: number): Promise<User | undefined> {
    return db('users').where({ id }).first();
  },

  async findByPhone(phone_number: string): Promise<User | undefined> {
    return db('users').where({ phone_number }).first();
  },
};

export default UserModel;