import request from 'supertest';
import app from '../app';
import db from '../database/db';

let userToken: string;

beforeAll(async () => {
  await db.migrate.latest();

  // Create a test user and get their token
  const res = await request(app)
    .post('/api/users/register')
    .send({
      full_name: 'Wallet Tester',
      email: 'wallettester@test.com',
      password: 'password123',
      phone_number: '08033333333',
      bvn: '44444444444',
    });

  userToken = res.body.data.id.toString();
});

afterAll(async () => {
  await db('transactions').del();
  await db('wallets').del();
  await db('users').del();
  await db.destroy();
});

describe('Wallet Funding', () => {
  it('should fund wallet successfully', async () => {
    const res = await request(app)
      .post('/api/wallet/fund')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Wallet funded successfully');
    expect(res.body.data.new_balance).toBe(5000);
  });

  it('should not fund with invalid amount', async () => {
    const res = await request(app)
      .post('/api/wallet/fund')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: -100 });

    expect(res.status).toBe(400);
  });

  it('should not fund without authentication', async () => {
    const res = await request(app)
      .post('/api/wallet/fund')
      .send({ amount: 1000 });

    expect(res.status).toBe(401);
  });
});

describe('Wallet Withdrawal', () => {
  it('should withdraw successfully', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.data.new_balance).toBe(4000);
  });

  it('should not withdraw more than balance', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Insufficient balance');
  });
});

describe('Fund Transfer', () => {
  it('should transfer funds successfully', async () => {
    // Create recipient first
    await request(app)
      .post('/api/users/register')
      .send({
        full_name: 'Recipient User',
        email: 'recipient@test.com',
        password: 'password123',
        phone_number: '08044444444',
        bvn: '55555555555',
      });

    const res = await request(app)
      .post('/api/wallet/transfer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipient_email: 'recipient@test.com',
        amount: 500,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Transfer successful');
    expect(res.body.data.new_balance).toBe(3500);
  });

  it('should not transfer to self', async () => {
    const res = await request(app)
      .post('/api/wallet/transfer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipient_email: 'wallettester@test.com',
        amount: 500,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot transfer to yourself');
  });

  it('should not transfer to non-existent user', async () => {
    const res = await request(app)
      .post('/api/wallet/transfer')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipient_email: 'ghost@test.com',
        amount: 500,
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Recipient not found');
  });
});

describe('Transaction History', () => {
  it('should return transaction list', async () => {
    const res = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});