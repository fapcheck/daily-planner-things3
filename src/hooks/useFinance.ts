import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Transaction,
  TransactionCategory,
  Debt,
  DebtPayment,
  Budget,
  RecurringTransaction,
  TransactionType,
  DebtType,
  BudgetPeriod,
  RecurrenceType
} from '@/types/finance';
import { addDays, addWeeks, addMonths, addYears, startOfDay, isBefore, isEqual } from 'date-fns';

// Currency configuration - can be made user-configurable in the future
export const CURRENCY_CONFIG = {
  locale: 'ru-RU',
  currency: 'RUB',
  maximumFractionDigits: 0,
};

// Helper functions for precise currency calculations
// Convert rubles to kopecks (smallest unit) to avoid floating point errors
const toKopecks = (rubles: number): number => Math.round(rubles * 100);
const toRubles = (kopecks: number): number => kopecks / 100;

// Helper to format currency consistently
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.currency,
    maximumFractionDigits: CURRENCY_CONFIG.maximumFractionDigits,
  }).format(amount);
};

export function useFinance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all finance data
  const fetchData = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setDebts([]);
      setBudgets([]);
      setRecurringTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('transaction_categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch debts with payments
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*, debt_payments(*)')
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (budgetsError) throw budgetsError;

      // Fetch recurring transactions
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (recurringError) throw recurringError;

      setCategories(categoriesData?.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type as TransactionType,
        color: c.color,
        icon: c.icon || undefined,
      })) || []);

      setTransactions(transactionsData?.map(t => ({
        id: t.id,
        categoryId: t.category_id || undefined,
        type: t.type as TransactionType,
        amount: Number(t.amount),
        description: t.description || undefined,
        date: new Date(t.date),
        createdAt: new Date(t.created_at),
      })) || []);

      setDebts(debtsData?.map(d => ({
        id: d.id,
        personName: d.person_name,
        type: d.type as DebtType,
        originalAmount: Number(d.original_amount),
        remainingAmount: Number(d.remaining_amount),
        description: d.description || undefined,
        dueDate: d.due_date ? new Date(d.due_date) : undefined,
        isSettled: d.is_settled,
        createdAt: new Date(d.created_at),
        payments: (d.debt_payments as any[])?.map((p: any) => ({
          id: p.id,
          debtId: p.debt_id,
          amount: Number(p.amount),
          note: p.note || undefined,
          paidAt: new Date(p.paid_at),
        })) || [],
      })) || []);

      setBudgets(budgetsData?.map(b => ({
        id: b.id,
        categoryId: b.category_id || undefined,
        amount: Number(b.amount),
        period: b.period as BudgetPeriod,
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
      })) || []);

      setRecurringTransactions(recurringData?.map(r => ({
        id: r.id,
        type: r.type as TransactionType,
        amount: Number(r.amount),
        categoryId: r.category_id || undefined,
        description: r.description || undefined,
        recurrenceType: r.recurrence_type as RecurrenceType,
        nextDueDate: new Date(r.next_due_date),
        isActive: r.is_active,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })) || []);

    } catch (error: any) {
      console.error('Error fetching finance data:', error);
      toast({
        title: 'Error loading finance data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Category operations
  const addCategory = useCallback(async (name: string, type: TransactionType, color: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .insert({ user_id: user.id, name, type, color })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, {
        id: data.id,
        name: data.name,
        type: data.type as TransactionType,
        color: data.color,
      }]);

      toast({ title: 'Category created' });
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('transaction_categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error deleting category', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // Transaction operations
  const addTransaction = useCallback(async (
    type: TransactionType,
    amount: number,
    description?: string,
    categoryId?: string,
    date?: Date
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type,
          amount,
          description,
          category_id: categoryId || null,
          date: (date || new Date()).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [{
        id: data.id,
        categoryId: data.category_id || undefined,
        type: data.type as TransactionType,
        amount: Number(data.amount),
        description: data.description || undefined,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
      }, ...prev]);

      toast({ title: `${type === 'income' ? 'Income' : 'Expense'} added` });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ title: 'Error adding transaction', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  const updateTransaction = useCallback(async (
    id: string,
    type: TransactionType,
    amount: number,
    description?: string,
    categoryId?: string,
    date?: Date
  ) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          type,
          amount,
          description: description || null,
          category_id: categoryId || null,
          date: date?.toISOString() || new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => prev.map(t =>
        t.id === id
          ? {
            id: data.id,
            categoryId: data.category_id || undefined,
            type: data.type as TransactionType,
            amount: Number(data.amount),
            description: data.description || undefined,
            date: new Date(data.date),
            createdAt: new Date(data.created_at),
          }
          : t
      ));

      toast({ title: 'Transaction updated' });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({ title: 'Error updating transaction', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({ title: 'Error deleting transaction', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // Debt operations
  const addDebt = useCallback(async (
    personName: string,
    type: DebtType,
    amount: number,
    description?: string,
    dueDate?: Date
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert({
          user_id: user.id,
          person_name: personName,
          type,
          original_amount: amount,
          remaining_amount: amount,
          description,
          due_date: dueDate?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setDebts(prev => [{
        id: data.id,
        personName: data.person_name,
        type: data.type as DebtType,
        originalAmount: Number(data.original_amount),
        remainingAmount: Number(data.remaining_amount),
        description: data.description || undefined,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        isSettled: data.is_settled,
        createdAt: new Date(data.created_at),
        payments: [],
      }, ...prev]);

      toast({ title: 'Debt added' });
    } catch (error: any) {
      console.error('Error adding debt:', error);
      toast({ title: 'Error adding debt', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  const addDebtPayment = useCallback(async (debtId: string, amount: number, note?: string, createTransaction = false) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    // Validate payment amount doesn't exceed remaining debt
    if (amount > debt.remainingAmount) {
      toast({
        title: 'Payment amount too high',
        description: `Payment cannot exceed remaining amount of ${formatCurrency(debt.remainingAmount)}`,
        variant: 'destructive',
      });
      return;
    }

    if (amount <= 0) {
      toast({
        title: 'Invalid payment amount',
        description: 'Payment amount must be greater than zero',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('debt_payments')
        .insert({ debt_id: debtId, amount, note })
        .select()
        .single();

      if (error) throw error;

      // Use kopecks for precise calculation to avoid floating point errors
      const remainingKopecks = toKopecks(debt.remainingAmount);
      const paymentKopecks = toKopecks(amount);
      const newRemainingKopecks = Math.max(0, remainingKopecks - paymentKopecks);
      const newRemaining = toRubles(newRemainingKopecks);
      const isSettled = newRemaining === 0;

      await supabase
        .from('debts')
        .update({ remaining_amount: newRemaining, is_settled: isSettled })
        .eq('id', debtId);

      // Optionally create a transaction to update balance
      if (createTransaction && user) {
        const transactionType: TransactionType = debt.type === 'owed_to_me' ? 'income' : 'expense';
        const description = debt.type === 'owed_to_me'
          ? `Debt payment from ${debt.personName}`
          : `Debt payment to ${debt.personName}`;

        try {
          const { data: transData, error: transError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              type: transactionType,
              amount,
              description,
              date: new Date().toISOString(),
            })
            .select()
            .single();

          if (transError) throw transError;

          // Update local transactions state
          setTransactions(prev => [{
            id: transData.id,
            categoryId: transData.category_id || undefined,
            type: transData.type as TransactionType,
            amount: Number(transData.amount),
            description: transData.description || undefined,
            date: new Date(transData.date),
            createdAt: new Date(transData.created_at),
          }, ...prev]);
        } catch (transError) {
          console.error('Error creating transaction for debt payment:', transError);
          // Continue - debt payment is still recorded even if transaction fails
        }
      }

      setDebts(prev => prev.map(d =>
        d.id === debtId
          ? {
            ...d,
            remainingAmount: newRemaining,
            isSettled,
            payments: [...(d.payments || []), {
              id: data.id,
              debtId: data.debt_id,
              amount: Number(data.amount),
              note: data.note || undefined,
              paidAt: new Date(data.paid_at),
            }],
          }
          : d
      ));

      toast({ title: 'Payment recorded' });
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({ title: 'Error recording payment', description: error.message, variant: 'destructive' });
    }
  }, [debts, toast, user, setTransactions]);

  const updateDebt = useCallback(async (
    id: string,
    personName: string,
    type: DebtType,
    originalAmount: number,
    description?: string,
    dueDate?: Date
  ) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    try {
      // Calculate remaining based on original difference
      const paidAmount = debt.originalAmount - debt.remainingAmount;
      const newRemaining = Math.max(0, originalAmount - paidAmount);
      const isSettled = newRemaining === 0;

      const { data, error } = await supabase
        .from('debts')
        .update({
          person_name: personName,
          type,
          original_amount: originalAmount,
          remaining_amount: newRemaining,
          description: description || null,
          due_date: dueDate?.toISOString() || null,
          is_settled: isSettled,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDebts(prev => prev.map(d =>
        d.id === id
          ? {
            ...d,
            personName: data.person_name,
            type: data.type as DebtType,
            originalAmount: Number(data.original_amount),
            remainingAmount: Number(data.remaining_amount),
            description: data.description || undefined,
            dueDate: data.due_date ? new Date(data.due_date) : undefined,
            isSettled: data.is_settled,
          }
          : d
      ));

      toast({ title: 'Debt updated' });
    } catch (error: any) {
      console.error('Error updating debt:', error);
      toast({ title: 'Error updating debt', description: error.message, variant: 'destructive' });
    }
  }, [debts, toast]);

  const deleteDebt = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (error: any) {
      console.error('Error deleting debt:', error);
      toast({ title: 'Error deleting debt', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // Budget operations
  const addBudget = useCallback(async (
    categoryId: string | undefined,
    amount: number,
    period: BudgetPeriod
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category_id: categoryId || null,
          amount,
          period,
        })
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => [{
        id: data.id,
        categoryId: data.category_id || undefined,
        amount: Number(data.amount),
        period: data.period as BudgetPeriod,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }, ...prev]);

      toast({ title: 'Budget created' });
    } catch (error: any) {
      console.error('Error adding budget:', error);
      toast({ title: 'Error creating budget', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  const updateBudget = useCallback(async (
    id: string,
    categoryId: string | undefined,
    amount: number,
    period: BudgetPeriod
  ) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          category_id: categoryId || null,
          amount,
          period,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBudgets(prev => prev.map(b =>
        b.id === id
          ? {
            id: data.id,
            categoryId: data.category_id || undefined,
            amount: Number(data.amount),
            period: data.period as BudgetPeriod,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          }
          : b
      ));

      toast({ title: 'Budget updated' });
    } catch (error: any) {
      console.error('Error updating budget:', error);
      toast({ title: 'Error updating budget', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const deleteBudget = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      setBudgets(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Budget deleted' });
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast({ title: 'Error deleting budget', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // Memoized computed values
  const totalIncome = useMemo(() =>
    transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const totalOwedToMe = useMemo(() =>
    debts
      .filter(d => d.type === 'owed_to_me' && !d.isSettled)
      .reduce((sum, d) => sum + d.remainingAmount, 0),
    [debts]
  );

  const totalIOwe = useMemo(() =>
    debts
      .filter(d => d.type === 'i_owe' && !d.isSettled)
      .reduce((sum, d) => sum + d.remainingAmount, 0),
    [debts]
  );

  const upcomingDebts = useMemo(() =>
    debts.filter(d =>
      !d.isSettled && d.dueDate && d.dueDate > new Date()
    ).sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0)),
    [debts]
  );

  const overdueDebts = useMemo(() =>
    debts.filter(d =>
      !d.isSettled && d.dueDate && d.dueDate < new Date()
    ),
    [debts]
  );

  // Adjust balance by creating an adjustment transaction
  const adjustBalance = useCallback(async (newBalance: number) => {
    if (!user) return;

    const difference = newBalance - balance;
    if (difference === 0) return;

    const type: TransactionType = difference > 0 ? 'income' : 'expense';
    const amount = Math.abs(difference);
    const description = 'Balance adjustment';

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type,
          amount,
          description,
          date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [{
        id: data.id,
        categoryId: data.category_id || undefined,
        type: data.type as TransactionType,
        amount: Number(data.amount),
        description: data.description || undefined,
        date: new Date(data.date),
        createdAt: new Date(data.created_at),
      }, ...prev]);

      toast({
        title: 'Balance adjusted',
        description: `${type === 'income' ? '+' : '-'}${formatCurrency(amount)}`
      });
    } catch (error: any) {
      console.error('Error adjusting balance:', error);
      toast({ title: 'Error adjusting balance', description: error.message, variant: 'destructive' });
    }
  }, [user, balance, toast]);

  // Recurring transaction operations
  const getNextDueDate = (currentDate: Date, recurrenceType: RecurrenceType): Date => {
    switch (recurrenceType) {
      case 'daily': return addDays(currentDate, 1);
      case 'weekly': return addWeeks(currentDate, 1);
      case 'monthly': return addMonths(currentDate, 1);
      case 'yearly': return addYears(currentDate, 1);
      default: return addMonths(currentDate, 1);
    }
  };

  const addRecurringTransaction = useCallback(async (
    type: TransactionType,
    amount: number,
    recurrenceType: RecurrenceType,
    nextDueDate: Date,
    description?: string,
    categoryId?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: user.id,
          type,
          amount,
          recurrence_type: recurrenceType,
          next_due_date: nextDueDate.toISOString(),
          description: description || null,
          category_id: categoryId || null,
        })
        .select()
        .single();

      if (error) throw error;

      setRecurringTransactions(prev => [...prev, {
        id: data.id,
        type: data.type as TransactionType,
        amount: Number(data.amount),
        categoryId: data.category_id || undefined,
        description: data.description || undefined,
        recurrenceType: data.recurrence_type as RecurrenceType,
        nextDueDate: new Date(data.next_due_date),
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }]);

      toast({ title: 'Recurring transaction added' });
    } catch (error: any) {
      console.error('Error adding recurring transaction:', error);
      toast({ title: 'Error adding recurring transaction', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  const updateRecurringTransaction = useCallback(async (
    id: string,
    type: TransactionType,
    amount: number,
    recurrenceType: RecurrenceType,
    nextDueDate: Date,
    isActive: boolean,
    description?: string,
    categoryId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({
          type,
          amount,
          recurrence_type: recurrenceType,
          next_due_date: nextDueDate.toISOString(),
          is_active: isActive,
          description: description || null,
          category_id: categoryId || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRecurringTransactions(prev => prev.map(r =>
        r.id === id ? {
          id: data.id,
          type: data.type as TransactionType,
          amount: Number(data.amount),
          categoryId: data.category_id || undefined,
          description: data.description || undefined,
          recurrenceType: data.recurrence_type as RecurrenceType,
          nextDueDate: new Date(data.next_due_date),
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        } : r
      ));

      toast({ title: 'Recurring transaction updated' });
    } catch (error: any) {
      console.error('Error updating recurring transaction:', error);
      toast({ title: 'Error updating recurring transaction', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  const deleteRecurringTransaction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
      setRecurringTransactions(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Recurring transaction deleted' });
    } catch (error: any) {
      console.error('Error deleting recurring transaction:', error);
      toast({ title: 'Error deleting recurring transaction', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  // Process due recurring transactions
  const processDueRecurringTransactions = useCallback(async () => {
    if (!user) return;

    const today = startOfDay(new Date());
    const dueTransactions = recurringTransactions.filter(r =>
      r.isActive && (isBefore(r.nextDueDate, today) || isEqual(startOfDay(r.nextDueDate), today))
    );

    for (const recurring of dueTransactions) {
      try {
        // Create the transaction
        const { data: transData, error: transError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: recurring.type,
            amount: recurring.amount,
            description: recurring.description || null,
            category_id: recurring.categoryId || null,
            date: recurring.nextDueDate.toISOString(),
          })
          .select()
          .single();

        if (transError) throw transError;

        // Update local transactions
        setTransactions(prev => [{
          id: transData.id,
          categoryId: transData.category_id || undefined,
          type: transData.type as TransactionType,
          amount: Number(transData.amount),
          description: transData.description || undefined,
          date: new Date(transData.date),
          createdAt: new Date(transData.created_at),
        }, ...prev]);

        // Update next due date
        const newNextDueDate = getNextDueDate(recurring.nextDueDate, recurring.recurrenceType);
        const { data: recurData, error: recurError } = await supabase
          .from('recurring_transactions')
          .update({ next_due_date: newNextDueDate.toISOString() })
          .eq('id', recurring.id)
          .select()
          .single();

        if (recurError) throw recurError;

        setRecurringTransactions(prev => prev.map(r =>
          r.id === recurring.id ? { ...r, nextDueDate: newNextDueDate } : r
        ));
      } catch (error) {
        console.error('Error processing recurring transaction:', error);
      }
    }

    if (dueTransactions.length > 0) {
      toast({
        title: `${dueTransactions.length} recurring transaction${dueTransactions.length > 1 ? 's' : ''} processed`
      });
    }
  }, [user, recurringTransactions, toast]);

  // Process due transactions on load
  useEffect(() => {
    if (!loading && recurringTransactions.length > 0) {
      processDueRecurringTransactions();
    }
  }, [loading]); // Only run when loading changes to false

  return {
    transactions,
    categories,
    debts,
    budgets,
    recurringTransactions,
    loading,
    addCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addDebt,
    updateDebt,
    addDebtPayment,
    deleteDebt,
    addBudget,
    updateBudget,
    deleteBudget,
    adjustBalance,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processDueRecurringTransactions,
    totalIncome,
    totalExpenses,
    balance,
    totalOwedToMe,
    totalIOwe,
    upcomingDebts,
    overdueDebts,
  };
}
