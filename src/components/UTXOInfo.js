import React from 'react';

const formatAddress = (address) => {
  if (!address) return 'N/A';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getAddressType = (type) => {
  switch (type) {
    case 'v0_p2wpkh': return 'Native SegWit';
    case 'v0_p2wsh': return 'Native SegWit (Script)';
    case 'v1_p2tr': return 'Taproot';
    case 'p2pkh': return 'Legacy';
    case 'p2sh': return 'Script Hash';
    default: return type || 'Unknown';
  };
};

const UTXOInfo = ({ utxo, totalValue, type }) => {
  console.log('UTXOInfo render attempt with:', { utxo, totalValue, type });
  
  if (!utxo || !totalValue) {
    console.log('UTXOInfo early return');
    return null;
  }

  const value = type === 'input' ? utxo.prevout?.value : utxo.value;
  const percentage = value ? ((value / totalValue) * 100).toFixed(2) : '0.00';

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: '10px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      fontSize: '14px',
      width: '300px',
      margin: '10px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
        {type === 'input' ? 'Input UTXO' : type === 'fee' ? 'Transaction Fee' : 'Output UTXO'}
      </h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        <li style={{ marginBottom: '5px' }}>
          <strong>Value:</strong> {value || 0} sats
        </li>
        <li style={{ marginBottom: '5px' }}>
          <strong>Total Transaction Percentage:</strong> {percentage}%
        </li>
        {type === 'input' && utxo.txid && (
          <>
            <li style={{ marginBottom: '5px' }}>
              <strong>Previous TX:</strong> {formatAddress(utxo.txid)}
            </li>
            <li style={{ marginBottom: '5px' }}>
              <strong>Address:</strong> {formatAddress(utxo.prevout?.scriptpubkey_address)}
            </li>
            <li style={{ marginBottom: '5px' }}>
              <strong>Type:</strong> {getAddressType(utxo.prevout?.scriptpubkey_type)}
            </li>
          </>
        )}
        {type === 'output' && (
          <>
            <li style={{ marginBottom: '5px' }}>
              <strong>Address:</strong> {formatAddress(utxo.scriptpubkey_address)}
            </li>
            <li style={{ marginBottom: '5px' }}>
              <strong>Type:</strong> {getAddressType(utxo.scriptpubkey_type)}
            </li>
          </>
        )}
        {type === 'fee' && (
          <li style={{ marginBottom: '5px' }}>
            <strong>Fee:</strong> {value} sats
          </li>
        )}
      </ul>
    </div>
  );
};

export default UTXOInfo;
