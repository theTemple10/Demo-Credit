import { randomBytes } from 'crypto';

const generateReference = (): string => {
  return `TXN-${randomBytes(16).toString('hex')}`;
};

export default generateReference;