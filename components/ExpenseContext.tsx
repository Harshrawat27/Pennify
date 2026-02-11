import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  date: Date;
}

interface ExpenseContextType {
  balance: number;
  transactions: Transaction[];
  addTransaction: (amount: number, description: string, type: TransactionType) => void;
  setInitialBalance: (amount: number) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (amount: number, description: string, type: TransactionType) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      amount,
      description,
      type,
      date: new Date(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);

    if (type === 'income') {
      setBalance((prev) => prev + amount);
    } else {
      setBalance((prev) => prev - amount);
    }
  };

  const setInitialBalance = (amount: number) => {
    setBalance(amount);
  };

  return (
    <ExpenseContext.Provider value={{ balance, transactions, addTransaction, setInitialBalance }}>
      {children}
    </ExpenseContext.Provider>
  );
};
