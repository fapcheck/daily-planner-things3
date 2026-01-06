import { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Users, 
  DollarSign,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/hooks/useFinance';
import { FinanceOverview } from './FinanceOverview';
import { TransactionList } from './TransactionList';
import { DebtList } from './DebtList';
import { RecurringTransactionList } from './RecurringTransactionList';
import { 
  FinanceSkeleton, 
  TransactionListSkeleton, 
  DebtListSkeleton, 
  RecurringListSkeleton 
} from './FinanceSkeleton';
import { FinanceView } from '@/types/finance';

const views: { id: FinanceView; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'recurring', label: 'Recurring', icon: Repeat },
  { id: 'debts', label: 'Debts', icon: Users },
];

export function FinanceSection() {
  const [currentView, setCurrentView] = useState<FinanceView>('overview');
  const {
    transactions,
    categories,
    debts,
    recurringTransactions,
    loading,
    addCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addDebt,
    updateDebt,
    addDebtPayment,
    deleteDebt,
    adjustBalance,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    totalIncome,
    totalExpenses,
    balance,
    totalOwedToMe,
    totalIOwe,
    upcomingDebts,
    overdueDebts,
  } = useFinance();

  const renderSkeleton = () => {
    switch (currentView) {
      case 'transactions':
        return <TransactionListSkeleton />;
      case 'debts':
        return <DebtListSkeleton />;
      case 'recurring':
        return <RecurringListSkeleton />;
      default:
        return <FinanceSkeleton />;
    }
  };

  return (
    <main className="flex-1 h-full overflow-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-8 pb-32 md:pb-8">
        {/* Header */}
        <header className="mb-6 animate-fade-up">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
              Finance
            </h1>
          </div>

          {/* Tab navigation - optimized for mobile, scrollable */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-fit",
                  currentView === view.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground active:bg-background/50"
                )}
              >
                <view.icon className="w-4 h-4 shrink-0" />
                <span className="text-xs md:text-sm">{view.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
          {loading ? renderSkeleton() : (
            <>
              {currentView === 'overview' && (
                <FinanceOverview
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                  balance={balance}
                  totalOwedToMe={totalOwedToMe}
                  totalIOwe={totalIOwe}
                  overdueDebts={overdueDebts}
                  upcomingDebts={upcomingDebts}
                  recurringTransactions={recurringTransactions}
                  onViewTransactions={() => setCurrentView('transactions')}
                  onViewDebts={() => setCurrentView('debts')}
                  onViewRecurring={() => setCurrentView('recurring')}
                  onAdjustBalance={adjustBalance}
                  onAddTransaction={addTransaction}
                />
              )}

              {currentView === 'transactions' && (
                <TransactionList
                  transactions={transactions}
                  categories={categories}
                  onAddTransaction={addTransaction}
                  onUpdateTransaction={updateTransaction}
                  onDeleteTransaction={deleteTransaction}
                  onAddCategory={addCategory}
                />
              )}

              {currentView === 'recurring' && (
                <RecurringTransactionList
                  recurringTransactions={recurringTransactions}
                  categories={categories}
                  onAddRecurring={addRecurringTransaction}
                  onUpdateRecurring={updateRecurringTransaction}
                  onDeleteRecurring={deleteRecurringTransaction}
                />
              )}

              {currentView === 'debts' && (
                <DebtList
                  debts={debts}
                  onAddDebt={addDebt}
                  onUpdateDebt={updateDebt}
                  onAddPayment={addDebtPayment}
                  onDeleteDebt={deleteDebt}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
