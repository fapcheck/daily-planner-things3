export type TransactionType = 'income' | 'expense';
export type DebtType = 'owed_to_me' | 'i_owe';

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  note?: string;
  paidAt: Date;
}

export interface Debt {
  id: string;
  personName: string;
  type: DebtType;
  originalAmount: number;
  remainingAmount: number;
  description?: string;
  dueDate?: Date;
  isSettled: boolean;
  createdAt: Date;
  payments?: DebtPayment[];
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  categoryId?: string;
  amount: number;
  period: BudgetPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  description?: string;
  recurrenceType: RecurrenceType;
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simplified to 4 views (added recurring)
export type FinanceView = 'overview' | 'transactions' | 'debts' | 'recurring';
