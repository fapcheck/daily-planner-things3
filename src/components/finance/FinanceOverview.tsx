import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Settings2,
  Repeat,
  Calendar,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Debt, RecurringTransaction, TransactionType } from '@/types/finance';
import { format, isWithinInterval, addDays, startOfDay } from 'date-fns';

interface FinanceOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalOwedToMe: number;
  totalIOwe: number;
  overdueDebts: Debt[];
  upcomingDebts: Debt[];
  recurringTransactions?: RecurringTransaction[];
  onViewTransactions?: () => void;
  onViewDebts?: () => void;
  onViewRecurring?: () => void;
  onAdjustBalance?: (newBalance: number) => void;
  onAddTransaction?: (type: TransactionType, amount: number, description?: string) => void;
}

export function FinanceOverview({
  totalIncome,
  totalExpenses,
  balance,
  totalOwedToMe,
  totalIOwe,
  overdueDebts,
  upcomingDebts,
  recurringTransactions = [],
  onViewTransactions,
  onViewDebts,
  onViewRecurring,
  onAdjustBalance,
  onAddTransaction,
}: FinanceOverviewProps) {
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState<TransactionType>('expense');
  const [quickAddAmount, setQuickAddAmount] = useState('');
  const [quickAddDescription, setQuickAddDescription] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAdjustBalance = () => {
    const newBalance = parseFloat(newBalanceInput.replace(/[^\d.-]/g, ''));
    if (!isNaN(newBalance) && onAdjustBalance) {
      onAdjustBalance(newBalance);
      setShowAdjustDialog(false);
      setNewBalanceInput('');
    }
  };

  const openAdjustDialog = () => {
    setNewBalanceInput(balance.toString());
    setShowAdjustDialog(true);
  };

  const openQuickAdd = (type: TransactionType) => {
    setQuickAddType(type);
    setQuickAddAmount('');
    setQuickAddDescription('');
    setShowQuickAdd(true);
  };

  const handleQuickAdd = () => {
    const amount = parseFloat(quickAddAmount);
    if (!isNaN(amount) && amount > 0 && onAddTransaction) {
      onAddTransaction(quickAddType, amount, quickAddDescription || undefined);
      setShowQuickAdd(false);
      setQuickAddAmount('');
      setQuickAddDescription('');
    }
  };

  // Get upcoming recurring transactions for next 7 days
  const today = startOfDay(new Date());
  const next7Days = addDays(today, 7);
  const upcomingRecurring = recurringTransactions
    .filter(rt => rt.isActive && isWithinInterval(rt.nextDueDate, { start: today, end: next7Days }))
    .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <Card className={cn(
        "bg-gradient-to-br border-2 relative",
        balance >= 0 
          ? "from-primary/10 to-primary/5 border-primary/20"
          : "from-destructive/10 to-destructive/5 border-destructive/20"
      )}>
        <CardContent className="pt-6">
          {/* Adjust button */}
          {onAdjustBalance && (
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={openAdjustDialog}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          )}
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className={cn(
              "text-4xl font-bold",
              balance >= 0 ? "text-primary" : "text-destructive"
            )}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Income</span>
              </div>
              <p className="text-lg font-semibold text-green-500">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium">Expenses</span>
              </div>
              <p className="text-lg font-semibold text-red-500">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjust Balance Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current balance: <span className="font-medium text-foreground">{formatCurrency(balance)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Enter your actual balance to create an adjustment transaction.
              </p>
            </div>
            <Input
              type="number"
              placeholder="New balance"
              value={newBalanceInput}
              onChange={(e) => setNewBalanceInput(e.target.value)}
              className="text-lg h-12"
              autoFocus
            />
            {newBalanceInput && !isNaN(parseFloat(newBalanceInput)) && (
              <div className="text-sm">
                <span className="text-muted-foreground">Adjustment: </span>
                <span className={cn(
                  "font-medium",
                  parseFloat(newBalanceInput) - balance >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {parseFloat(newBalanceInput) - balance >= 0 ? '+' : ''}
                  {formatCurrency(parseFloat(newBalanceInput) - balance)}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustBalance}
              disabled={!newBalanceInput || isNaN(parseFloat(newBalanceInput)) || parseFloat(newBalanceInput) === balance}
            >
              Set Balance
            </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={quickAddType === 'income' ? 'text-green-500' : 'text-red-500'}>
              Add {quickAddType === 'income' ? 'Income' : 'Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="number"
              placeholder="Amount"
              value={quickAddAmount}
              onChange={(e) => setQuickAddAmount(e.target.value)}
              className="text-lg h-12"
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={quickAddDescription}
              onChange={(e) => setQuickAddDescription(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowQuickAdd(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleQuickAdd}
              disabled={!quickAddAmount || isNaN(parseFloat(quickAddAmount)) || parseFloat(quickAddAmount) <= 0}
              className={quickAddType === 'income' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
            >
              Add {quickAddType === 'income' ? 'Income' : 'Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Buttons */}
      {onAddTransaction && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-14 border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50"
            onClick={() => openQuickAdd('income')}
          >
            <Plus className="w-4 h-4 mr-2 text-green-500" />
            <span className="text-green-500 font-medium">Add Income</span>
          </Button>
          <Button
            variant="outline"
            className="h-14 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
            onClick={() => openQuickAdd('expense')}
          >
            <Plus className="w-4 h-4 mr-2 text-red-500" />
            <span className="text-red-500 font-medium">Add Expense</span>
          </Button>
        </div>
      )}

      {/* Debt Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewDebts}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs font-medium">Owed to You</span>
            </div>
            <p className="text-xl font-bold text-green-500">
              {formatCurrency(totalOwedToMe)}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onViewDebts}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <ArrowDownRight className="w-4 h-4" />
              <span className="text-xs font-medium">You Owe</span>
            </div>
            <p className="text-xl font-bold text-red-500">
              {formatCurrency(totalIOwe)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue debts warning */}
      {overdueDebts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5 cursor-pointer" onClick={onViewDebts}>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive text-base">
              {overdueDebts.length} Overdue {overdueDebts.length === 1 ? 'Debt' : 'Debts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              {overdueDebts.slice(0, 2).map(debt => (
                <div key={debt.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium">{debt.personName}</span>
                  <span className={cn(
                    "font-medium",
                    debt.type === 'i_owe' ? "text-red-500" : "text-green-500"
                  )}>
                    {formatCurrency(debt.remainingAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Recurring Transactions */}
      {upcomingRecurring.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Upcoming This Week</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onViewRecurring}>
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRecurring.slice(0, 4).map(rt => (
                <div key={rt.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      rt.type === 'income' ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                      {rt.type === 'income' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {rt.description || (rt.type === 'income' ? 'Income' : 'Expense')}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(rt.nextDueDate, 'EEE, MMM d')}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-medium text-sm",
                    rt.type === 'income' ? "text-green-500" : "text-red-500"
                  )}>
                    {rt.type === 'income' ? '+' : '-'}
                    {formatCurrency(rt.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Debts */}
      {upcomingDebts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Upcoming Due Dates</CardTitle>
            <Button variant="ghost" size="sm" onClick={onViewDebts}>
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDebts.slice(0, 3).map(debt => (
                <div key={debt.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{debt.personName}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {debt.dueDate && format(debt.dueDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={cn(
                    "font-medium text-sm",
                    debt.type === 'i_owe' ? "text-red-500" : "text-green-500"
                  )}>
                    {formatCurrency(debt.remainingAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
