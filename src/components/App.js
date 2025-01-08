import React, { useState } from 'react';
import { fetchTransaction } from '../api/api';

const App = () => {
  const [transactionId, setTransactionId] = useState('');
  const [transactionData, setTransactionData] = useState(null);

  const handleInputChange = (e) => {
    setTransactionId(e.target.value);
  };

  const handleButtonClick = async () => {
    try {
      const data = await fetchTransaction(transactionId);
      setTransactionData(data);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={transactionId}
        onChange={handleInputChange}
        placeholder="Enter Transaction ID"
      />
      <button onClick={handleButtonClick}>Fetch Transaction</button>
      {transactionData && (
        <div>
          <h3>Inputs</h3>
          <ul>
            {transactionData.vin.map((input, index) => (
              <li key={index}>
                ID: {input.txid}, Amount: {input.prevout ? input.prevout.value : 'N/A'}
              </li>
            ))}
          </ul>
          <h3>Outputs</h3>
          <ul>
            {transactionData.vout.map((output, index) => (
              <li key={index}>
                Address: {output.scriptpubkey_address}, Amount: {output.value}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
