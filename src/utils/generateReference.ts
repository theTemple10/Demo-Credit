import { v4 as uuidv4 } from 'uuid';

const generateReference = (): string => {
  return `TXN-${uuidv4()}`;
};

export default generateReference;