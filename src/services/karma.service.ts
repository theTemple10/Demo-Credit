import axios from 'axios';

const karmaCheck = async (identity: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `https://adjutor.lendsqr.com/v2/verification/karma/${identity}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ADJUTOR_API_KEY}`,
        },
      }
    );

    // If the response is successful, then the user is on the blacklist
    return response.data.status === 'success';
  } catch (error: any) {
    // A 404 means the user is not on the blacklist
    if (error.response && error.response.status === 404) {
      return false;
    }
    // For any other error, I throw so the calling code can handle it
    throw new Error('Karma check failed');
  }
};

export default karmaCheck;