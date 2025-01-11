import React, { useState, useRef } from 'react';
import { fetchTransaction } from '../api/api';
import CanvasBackground from './CanvasBackground';
import UTXOInfo from './UTXOInfo';

const App = () => {
  const [transactionId, setTransactionId] = useState('');
  const [transactionData, setTransactionData] = useState(null);
  const recenterRef = useRef();

  // New state variables for sliders
  const [lineThicknessRatio, setLineThicknessRatio] = useState(1); // Default ratio
  const [lineSpacing, setLineSpacing] = useState(10); // Default spacing in pixels
  const [lineLength, setLineLength] = useState(400); // Default line length
  const [minLineThickness, setMinLineThickness] = useState(0.1); // Default minimum thickness

  const [hoveredUtxo, setHoveredUtxo] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const handleInputChange = (e) => {
    setTransactionId(e.target.value);
  };

  const handleButtonClick = async () => {
    if (!transactionId) return; // Prevent empty requests
    try {
      const data = await fetchTransaction(transactionId);
      setTransactionData(data);
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      alert('Failed to fetch transaction. Please check the ID and try again.');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CanvasBackground
        recenterRef={recenterRef}
        transactionData={transactionData}
        lineThicknessRatio={lineThicknessRatio} // Pass slider value
        lineSpacing={lineSpacing} // Pass slider value
        lineLength={lineLength}
        minLineThickness={minLineThickness}
        onHover={(utxo, type) => {
          setHoveredUtxo(utxo);
          setHoveredType(type);
        }}
      />
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '4px',
        zIndex: 2
      }}>
        <input
          type="text"
          value={transactionId}
          onChange={handleInputChange}
          placeholder="Enter Transaction ID"
          style={{ width: '300px', padding: '8px' }}
        />
        <button onClick={handleButtonClick} style={{ marginLeft: '10px', padding: '8px 16px' }}>
          Fetch Transaction
        </button>
        {transactionData && (
          <div style={{ marginTop: '10px' }}>
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
              {transactionData.fee && (
                <li>
                  Fee: {transactionData.fee}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {/* Recenter Button */}
      <button
        onClick={() => recenterRef.current && recenterRef.current()}
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          padding: '8px 16px',
          zIndex: 2
        }}
      >
        Recenter
      </button>
      
      {/* Sliders Container */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '4px',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '220px' // Adjusted width to accommodate all sliders
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Thickness Ratio:
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={lineThicknessRatio}
            onChange={(e) => setLineThicknessRatio(parseFloat(e.target.value))}
            style={{ width: '120px' }} // Adjusted width
          />
          <span>{lineThicknessRatio.toFixed(1)}</span>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Line Spacing:
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={lineSpacing}
            onChange={(e) => setLineSpacing(parseInt(e.target.value, 10))}
            style={{ width: '120px' }}
          />
          <span>{lineSpacing}</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Line Length:
          <input
            type="range"
            min="200"
            max="1500" // Increased maximum from 800 to 1500
            step="100" // Adjusted step for finer control
            value={lineLength}
            onChange={(e) => setLineLength(parseInt(e.target.value, 10))}
            style={{ width: '120px' }}
          />
          <span>{lineLength}</span>
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Min Thickness:
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={minLineThickness}
            onChange={(e) => setMinLineThickness(parseFloat(e.target.value))}
            style={{ width: '120px' }}
          />
          <span>{minLineThickness.toFixed(1)}</span>
        </label>
      </div>

      {/* UTXOInfo Popup */}
      {hoveredUtxo && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000
        }}>
          <UTXOInfo
            utxo={hoveredUtxo}
            totalValue={transactionData.vin.reduce((sum, input) => sum + (input.prevout?.value || 0), 0)}
            type={hoveredType}
          />
        </div>
      )}
    </div>
  );
};

export default App;

