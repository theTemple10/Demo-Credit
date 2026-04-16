import express, { Application, Request, Response } from 'express';
import userRoutes from './routes/user.routes';
import walletRoutes from './routes/wallet.routes';

const app: Application = express();

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Demo Credit API is running' });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;