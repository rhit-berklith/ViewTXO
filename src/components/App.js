import React, { useState, useRef, useEffect } from 'react';
import { fetchTransaction } from '../api/api';
import * as d3 from 'd3';
import CanvasBackground from './CanvasBackground';

const App = () => {
  const [transactionId, setTransactionId] = useState('');
  const [transactionData, setTransactionData] = useState(null);
  const svgRef = useRef();
  const recenterRef = useRef();

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
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CanvasBackground recenterRef={recenterRef} />
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
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
      <button
        onClick={() => recenterRef.current && recenterRef.current()}
        style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1 }}
      >
        Recenter
      </button>
    </div>
  );
};

export default App;
