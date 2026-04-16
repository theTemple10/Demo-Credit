import request from 'supertest';
import app from '../app';
import db from '../database/db';

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db('transactions').del();
  await db('wallets').del();
  await db('users').del();
  await db.destroy();
});

describe('User Registration', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        full_name: 'Test User',
        email: 'testuser@test.com',
        password: 'password123',
        phone_number: '08011111111',
        bvn: '11111111111',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('testuser@test.com');
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: 'incomplete@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All fields are required');
  });

  it('should not register with duplicate email', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        full_name: 'Test User',
        email: 'testuser@test.com',
        password: 'password123',
        phone_number: '08022222222',
        bvn: '22222222222',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email already in use');
  });

  it('should not register with duplicate phone number', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        full_name: 'Test User',
        email: 'different@test.com',
        password: 'password123',
        phone_number: '08011111111',
        bvn: '33333333333',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Phone number already in use');
  });
});

describe('User Login', () => {
  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'testuser@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toHaveProperty('token');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'testuser@test.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should not login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'nobody@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});