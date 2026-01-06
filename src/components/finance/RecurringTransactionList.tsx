import { useState } from 'react';
import { Plus, Repeat, TrendingUp, TrendingDown, MoreVertical, Pencil, Trash2, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { RecurringTransaction, TransactionCategory, TransactionType, RecurrenceType } from '@/types/finance';
import { format } from 'date-fns';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface RecurringTransactionListProps {
  recurringTransactions: RecurringTransaction[];
  categories: TransactionCategory[];
  onAddRecurring: (
    type: TransactionType,
    amount: number,
    recurrenceType: RecurrenceType,
    nextDueDate: Date,
    description?: string,
    categoryId?: string
  ) => void;
  onUpdateRecurring: (
    id: string,
    type: TransactionType,
    amount: number,
    recurrenceType: RecurrenceType,
    nextDueDate: Date,
    isActive: boolean,
    description?: string,
    categoryId?: string
  ) => void;
  onDeleteRecurring: (id: string) => void;
}

const recurrenceLabels: Record<RecurrenceType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function RecurringTransactionList({
  recurringTransactions,
  categories,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
}: RecurringTransactionListProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDescription('');
    setRecurrenceType('monthly');
    setNextDueDate('');
    setCategoryId('');
    setEditingRecurring(null);
  };

  const openAddDialog = () => {
    resetForm();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextDueDate(format(tomorrow, 'yyyy-MM-dd'));
    setShowDialog(true);
  };

  const openEditDialog = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setType(recurring.type);
    setAmount(recurring.amount.toString());
    setDescription(recurring.description || '');
    setRecurrenceType(recurring.recurrenceType);
    setNextDueDate(format(recurring.nextDueDate, 'yyyy-MM-dd'));
    setCategoryId(recurring.categoryId || '');
    setShowDialog(true);
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !nextDueDate) return;

    if (editingRecurring) {
      onUpdateRecurring(
        editingRecurring.id,
        type,
        parsedAmount,
        recurrenceType,
        new Date(nextDueDate),
        editingRecurring.isActive,
        description || undefined,
        categoryId || undefined
      );
    } else {
      onAddRecurring(
        type,
        parsedAmount,
        recurrenceType,
        new Date(nextDueDate),
        description || undefined,
        categoryId || undefined
      );
    }

    setShowDialog(false);
    resetForm();
  };

  const toggleActive = (recurring: RecurringTransaction) => {
    onUpdateRecurring(
      recurring.id,
      recurring.type,
      recurring.amount,
      recurring.recurrenceType,
      recurring.nextDueDate,
      !recurring.isActive,
      recurring.description,
      recurring.categoryId
    );
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const activeRecurring = recurringTransactions.filter(r => r.isActive);
  const pausedRecurring = recurringTransactions.filter(r => !r.isActive);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recurring Transactions</h2>
        <Button onClick={openAddDialog} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Active recurring */}
      {activeRecurring.length > 0 && (
        <div className="space-y-2">
          {activeRecurring.map(recurring => (
            <Card key={recurring.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full shrink-0",
                    recurring.type === 'income' ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    {recurring.type === 'income' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {recurring.description || (recurring.type === 'income' ? 'Income' : 'Expense')}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Repeat className="w-3 h-3" />
                      <span>{recurrenceLabels[recurring.recurrenceType]}</span>
                      <span>•</span>
                      <span>Next: {format(recurring.nextDueDate, 'MMM d')}</span>
                    </div>
                  </div>

                  <div className={cn(
                    "font-semibold text-sm shrink-0",
                    recurring.type === 'income' ? "text-green-500" : "text-red-500"
                  )}>
                    {recurring.type === 'income' ? '+' : '-'}
                    {formatCurrency(recurring.amount)}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(recurring)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(recurring)}>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(recurring.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paused recurring */}
      {pausedRecurring.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Paused</p>
          {pausedRecurring.map(recurring => (
            <Card key={recurring.id} className="overflow-hidden opacity-60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted shrink-0">
                    <Pause className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {recurring.description || (recurring.type === 'income' ? 'Income' : 'Expense')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recurrenceLabels[recurring.recurrenceType]} • {formatCurrency(recurring.amount)}
                    </p>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleActive(recurring)}
                    className="gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Resume
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteId(recurring.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {recurringTransactions.length === 0 && (
        <div className="text-center py-12">
          <Repeat className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground mb-2">No recurring transactions</p>
          <p className="text-sm text-muted-foreground/60 mb-4">
            Set up regular income or expenses like salary, subscriptions, or bills
          </p>
          <Button onClick={openAddDialog} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Recurring Transaction
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRecurring ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Type selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setType('expense')}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Expense
              </Button>
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setType('income')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Income
              </Button>
            </div>

            {/* Amount */}
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg h-12"
            />

            {/* Description */}
            <Input
              placeholder="Description (e.g., Netflix, Salary)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Recurrence */}
            <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}>
              <SelectTrigger>
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

            {/* Next due date */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Next due date</label>
              <Input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
              />
            </div>

            {/* Category */}
            {filteredCategories.length > 0 && (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || !nextDueDate}
            >
              {editingRecurring ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDeleteRecurring(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Recurring Transaction"
        itemName="this recurring transaction"
      />
    </div>
  );
}
