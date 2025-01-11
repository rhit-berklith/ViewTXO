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

export const fetchTxOutspends = async (transactionId) => {
  try {
    const response = await axios.get(`https://blockstream.info/api/tx/${transactionId}/outspends`);
    return response.data; // Array of objects corresponding to each output
  } catch (error) {
    console.error('Error fetching outspends:', error);
    throw error;
  }
};
