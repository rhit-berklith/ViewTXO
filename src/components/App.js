import React, { useState, useRef, useCallback } from 'react';
import { fetchTransaction } from '../api/api';
import CanvasBackground from './CanvasBackground';
import UTXOInfo from './UTXOInfo';
import { TransactionsProvider, useTransactions } from '../contexts/TransactionsContext';

function throttle(fn, limit) {
  let inThrottle = false, lastFn;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastFn) {
          lastFn(...args);
          lastFn = null;
        }
      }, limit);
    } else {
      lastFn = () => fn(...args);
    }
  };
}

const AppContent = () => {
  const [transactionIds, setTransactionIds] = useState([]);
  const [transactions, setTransactions] = useState([]); // local array for quick reference
  const recenterRef = useRef();

  // Use refs to store values without re-rendering on every slider move
  const lineThicknessRatioRef = useRef(1);
  const lineSpacingRef = useRef(10);
  const lineLengthRef = useRef(400);
  const minLineThicknessRef = useRef(0.1);

  // We keep real state to pass into CanvasBackground,
  // but we only update it via a throttled function
  const [lineThicknessRatio, setLineThicknessRatio] = useState(lineThicknessRatioRef.current);
  const [lineSpacing, setLineSpacing] = useState(lineSpacingRef.current);
  const [lineLength, setLineLength] = useState(lineLengthRef.current);
  const [minLineThickness, setMinLineThickness] = useState(minLineThicknessRef.current);

  const updateSlidersThrottled = useCallback(throttle(() => {
    setLineThicknessRatio(lineThicknessRatioRef.current);
    setLineSpacing(lineSpacingRef.current);
    setLineLength(lineLengthRef.current);
    setMinLineThickness(minLineThicknessRef.current);
  }, 50), []); // Change limit to 10ms for 100 updates per second

  const handleThicknessChange = (val) => {
    lineThicknessRatioRef.current = parseFloat(val);
    updateSlidersThrottled();
  };
  const handleSpacingChange = (val) => {
    lineSpacingRef.current = parseInt(val, 10);
    updateSlidersThrottled();
  };
  const handleLengthChange = (val) => {
    lineLengthRef.current = parseInt(val, 10);
    updateSlidersThrottled();
  };
  const handleMinThicknessChange = (val) => {
    minLineThicknessRef.current = parseFloat(val);
    updateSlidersThrottled();
  };

  const [hoveredUtxo, setHoveredUtxo] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const handleMultipleInputChange = (e) => {
    // e.g. split by comma
    setTransactionIds(e.target.value.split(',').map(id => id.trim()).filter(Boolean));
  };

  const { addTransaction, globalMaxValue } = useTransactions();

  const handleFetchAll = async () => {
    const newTxs = [];
    for (const txid of transactionIds) {
      if (!txid) continue;
      try {
        const data = await fetchTransaction(txid);
        newTxs.push(data);
        addTransaction(data);
      } catch (error) {
        console.error('Error fetching transaction data for', txid, error);
      }
    }
    setTransactions(newTxs);
  };

  // Modified to accept the index
  const handleSpentOutputClick = async (spentTxid, clickedIndex) => {
    try {
      const data = await fetchTransaction(spentTxid);
      setTransactions((prev) => [...prev, data]);
      addTransaction(data);
      // Optionally store or return the clickedIndex for position in CanvasBackground,
      // but we’ll just rely on CanvasBackground to recalculate positions.
    } catch (error) {
      console.error('Error fetching spent tx', spentTxid, error);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CanvasBackground
        recenterRef={recenterRef}
        allTransactions={transactions}
        globalMaxValue={globalMaxValue}
        lineThicknessRatio={lineThicknessRatio} // Pass slider value
        lineSpacing={lineSpacing} // Pass slider value
        lineLength={lineLength}
        minLineThickness={minLineThickness}
        onHover={(utxo, type, tx) => {
          setHoveredUtxo(utxo);
          setHoveredType({ tx, type }); // store transaction as well
        }}
        onSpentOutputClick={handleSpentOutputClick} // pass down
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
          onChange={handleMultipleInputChange}
          placeholder="Enter multiple TXIDs separated by commas"
          style={{ width: '300px', padding: '8px' }}
        />
        <button onClick={handleFetchAll} style={{ marginLeft: '10px', padding: '8px 16px' }}>
          Fetch All
        </button>
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
            defaultValue={lineThicknessRatioRef.current}
            onChange={(e) => handleThicknessChange(e.target.value)}
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
            defaultValue={lineSpacingRef.current}
            onChange={(e) => handleSpacingChange(e.target.value)}
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
            defaultValue={lineLengthRef.current}
            onChange={(e) => handleLengthChange(e.target.value)}
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
            defaultValue={minLineThicknessRef.current}
            onChange={(e) => handleMinThicknessChange(e.target.value)}
            style={{ width: '120px' }}
          />
          <span>{minLineThickness.toFixed(1)}</span>
        </label>
      </div>

      {/* UTXOInfo Popup */}
      {hoveredUtxo && hoveredType?.tx && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000
        }}>
          <UTXOInfo
            utxo={hoveredUtxo}
            totalValue={hoveredType.tx.vin.reduce(
              (sum, input) => sum + (input.prevout?.value || 0),
              0
            )}
            type={hoveredType.type}
          />
        </div>
      )}
    </div>
  );
};

const App = () => (
  <TransactionsProvider>
    <AppContent />
  </TransactionsProvider>
);

export default App;

