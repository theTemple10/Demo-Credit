import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import db from './database/db';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.migrate.latest();
    console.log('Database migrations completed');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();