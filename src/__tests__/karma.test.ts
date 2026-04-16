import axios from 'axios';
import karmaCheck from '../services/karma.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Karma Blacklist Check', () => {
  it('should return true when user is blacklisted', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { status: 'success' },
    });

    const result = await karmaCheck('blacklisted@test.com');
    expect(result).toBe(true);
  });

  it('should return false when user is not blacklisted', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 404 },
    });

    const result = await karmaCheck('clean@test.com');
    expect(result).toBe(false);
  });

  it('should throw error on unexpected API failure', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: { status: 500 },
    });

    await expect(karmaCheck('error@test.com')).rejects.toThrow('Karma check failed');
  });
});