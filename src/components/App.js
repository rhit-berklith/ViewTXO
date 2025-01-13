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

// Define the tree node structure
class TransactionNode {
  constructor(data, parent = null) {
    this.data = data;
    this.parent = parent;
    this.children = new Map(); // Map<outputIndex, TransactionNode>
    this.position = { x: 0, y: 0 };
  }
}

const AppContent = () => {
  const [rootNodes, setRootNodes] = useState([]);
  const [transactionId, setTransactionId] = useState(''); // Add this state
  const [selectedOutputs, setSelectedOutputs] = useState(new Map());
  const recenterRef = useRef();
  const initialScaleRef = useRef(null);

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
    setTransactionId(e.target.value); // Update this
  };

  const { addTransaction, globalMaxValue } = useTransactions();

  const handleFetchAll = async () => {
    if (!transactionId) return;
    
    const ids = transactionId.split(',').map(id => id.trim()).filter(Boolean);
    console.log('Fetching transactions for IDs:', ids);

    const newRoots = [];
    for (const txid of ids) {
      try {
        console.log('Fetching transaction:', txid);
        const data = await fetchTransaction(txid);
        console.log('Received transaction data:', data);
        
        const node = new TransactionNode(data);
        node.position = { x: newRoots.length * 500, y: 0 }; // Set initial position
        newRoots.push(node);
        addTransaction(data);
        
        if (!initialScaleRef.current) {
          initialScaleRef.current = {
            value: data.vin.reduce((sum, input) => sum + (input.prevout?.value || 0), 0)
          };
        }
      } catch (error) {
        console.error('Error fetching transaction data for', txid, error);
      }
    }
    
    console.log('Setting new roots:', newRoots);
    setRootNodes(newRoots);
  };

  // Modified to work with tree structure
  const handleSpentOutputClick = async (spentTxid, parentNode, outputIndex) => {
    const outputKey = `${parentNode.data.txid}_${outputIndex}`;
    
    // If already selected, remove this node and all its children
    if (selectedOutputs.has(outputKey)) {
      const removeNode = (node) => {
        // Recursively remove all children
        for (const childNode of node.children.values()) {
          removeNode(childNode);
        }
        // Remove from parent's children
        if (node.parent) {
          const parentKey = `${node.parent.data.txid}_${node.outputIndex}`;
          setSelectedOutputs(prev => {
            const next = new Map(prev);
            next.delete(parentKey);
            return next;
          });
        }
      };

      const childNode = parentNode.children.get(outputIndex);
      if (childNode) {
        removeNode(childNode);
        parentNode.children.delete(outputIndex);
        setRootNodes([...rootNodes]); // Force update
      }
      return;
    }

    // Otherwise fetch and add new child node
    try {
      const data = await fetchTransaction(spentTxid);
      const newNode = new TransactionNode(data, parentNode);
      newNode.outputIndex = outputIndex;
      
      // Position the new node to the right of its parent
      newNode.position = {
        x: parentNode.position.x + 500,
        y: parentNode.position.y
      };

      parentNode.children.set(outputIndex, newNode);
      addTransaction(data);
      setSelectedOutputs(prev => {
        const next = new Map(prev);
        next.set(outputKey, data.txid);
        return next;
      });
      setRootNodes([...rootNodes]); // Force update
    } catch (error) {
      console.error('Error fetching spent tx', spentTxid, error);
    }
  };

  // Flatten tree for rendering
  const getAllNodes = (roots) => {
    const nodes = [];
    const traverse = (node) => {
      console.log('Traversing node:', node);
      nodes.push(node);
      for (const child of node.children.values()) {
        traverse(child);
      }
    };
    roots.forEach(traverse);
    console.log('All nodes:', nodes);
    return nodes;
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CanvasBackground
        recenterRef={recenterRef}
        allTransactions={getAllNodes(rootNodes)}
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
        selectedOutputs={selectedOutputs}
        initialScale={initialScaleRef.current}
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
          onChange={handleMultipleInputChange}
          placeholder="Enter transaction ID"
          style={{ width: '300px', padding: '8px' }}
        />
        <button 
          onClick={handleFetchAll} 
          disabled={!transactionId}
          style={{ marginLeft: '10px', padding: '8px 16px' }}
        >
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

