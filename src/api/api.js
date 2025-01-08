import axios from 'axios';

export const fetchTransaction = async (transactionId) => {
  try {
    const response = await axios.get(`https://blockstream.info/api/tx/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    throw error;
  }
};
