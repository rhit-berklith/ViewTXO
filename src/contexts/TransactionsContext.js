import React, { createContext, useContext, useState } from 'react';

const TransactionsContext = createContext();

export function TransactionsProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [globalMaxValue, setGlobalMaxValue] = useState(1);

  const addTransaction = (transaction) => {
    const newTransactions = [...transactions, transaction];
    
    // Update global max value
    const newMaxValue = Math.max(
      ...newTransactions.flatMap(tx => [
        ...tx.vin.map(input => input.prevout?.value || 0),
        ...tx.vout.map(output => output.value),
        tx.fee || 0
      ])
    );

    setGlobalMaxValue(newMaxValue || 1);
    setTransactions(newTransactions);
  };

  return (
    <TransactionsContext.Provider value={{
      transactions,
      globalMaxValue,
      addTransaction
    }}>
      {children}
    </TransactionsContext.Provider>
  );
}

// Check your server or baseURL in fetchTransaction calls, and ensure no CORS or connectivity issues.

export const useTransactions = () => useContext(TransactionsContext);