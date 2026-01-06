import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Pencil, CalendarIcon, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Transaction, TransactionCategory, TransactionType } from '@/types/finance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
  onAddTransaction: (
    type: TransactionType,
    amount: number,
    description?: string,
    categoryId?: string,
    date?: Date
  ) => void;
  onUpdateTransaction: (
    id: string,
    type: TransactionType,
    amount: number,
    description?: string,
    categoryId?: string,
    date?: Date
  ) => void;
  onDeleteTransaction: (id: string) => void;
  onAddCategory?: (name: string, type: TransactionType, color: string) => void;
}

const quickColors = [
  'hsl(142, 76%, 36%)',
  'hsl(0, 72%, 51%)',
  'hsl(211, 100%, 50%)',
  'hsl(280, 68%, 50%)',
  'hsl(45, 93%, 47%)',
  'hsl(24, 95%, 53%)',
];

export function TransactionList({
  transactions,
  categories,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddCategory,
}: TransactionListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | TransactionType>('all');
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  
  // New category inline creation
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(quickColors[0]);

  const transactionToDelete = deleteTransactionId 
    ? transactions.find(t => t.id === deleteTransactionId) 
    : null;

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDescription('');
    setCategoryId('');
    setDate(new Date());
    setEditingTransaction(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  const openAddDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description || '');
    setCategoryId(transaction.categoryId || '');
    setDate(transaction.date);
    setIsOpen(true);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim() || !onAddCategory) return;
    onAddCategory(newCategoryName.trim(), type, newCategoryColor);
    setNewCategoryName('');
    setIsCreatingCategory(false);
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingTransaction) {
      onUpdateTransaction(
        editingTransaction.id,
        type,
        parsedAmount,
        description || undefined,
        categoryId || undefined,
        date
      );
    } else {
      onAddTransaction(
        type,
        parsedAmount,
        description || undefined,
        categoryId || undefined,
        date
      );
    }

    resetForm();
    setIsOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getCategoryName = (id?: string) => {
    if (!id) return null;
    return categories.find(c => c.id === id)?.name;
  };

  const getCategoryColor = (id?: string) => {
    if (!id) return undefined;
    return categories.find(c => c.id === id)?.color;
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={openAddDialog} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Type selector */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  type === 'income' && "bg-green-500 hover:bg-green-600"
                )}
                onClick={() => { setType('income'); setCategoryId(''); }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Income
              </Button>
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  type === 'expense' && "bg-red-500 hover:bg-red-600"
                )}
                onClick={() => { setType('expense'); setCategoryId(''); }}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Expense
              </Button>
            </div>

            {/* Amount */}
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />

            {/* Description */}
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Category with inline creation */}
            {!isCreatingCategory ? (
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {onAddCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreatingCategory(true)}
                    title="Create new category"
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {quickColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform",
                          newCategoryColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingCategory(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(date, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleSubmit} className="w-full">
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No transactions yet</p>
              <p className="text-sm mt-1">Add your first transaction to get started</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map(transaction => (
            <Card 
              key={transaction.id} 
              className="group cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => openEditDialog(transaction)}
            >
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    transaction.type === 'income' 
                      ? "bg-green-500/10" 
                      : "bg-red-500/10"
                  )}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {transaction.description || (transaction.type === 'income' ? 'Income' : 'Expense')}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(transaction.date, 'MMM d')}</span>
                      {getCategoryName(transaction.categoryId) && (
                        <>
                          <span>•</span>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{ 
                              backgroundColor: `${getCategoryColor(transaction.categoryId)}15`,
                              color: getCategoryColor(transaction.categoryId)
                            }}
                          >
                            {getCategoryName(transaction.categoryId)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold",
                    transaction.type === 'income' ? "text-green-500" : "text-red-500"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); setDeleteTransactionId(transaction.id); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTransactionId}
        onOpenChange={(open) => !open && setDeleteTransactionId(null)}
        onConfirm={() => {
          if (deleteTransactionId) {
            onDeleteTransaction(deleteTransactionId);
            setDeleteTransactionId(null);
          }
        }}
        title="Delete Transaction"
        itemName={transactionToDelete?.description || (transactionToDelete?.type === 'income' ? 'Income' : 'Expense')}
      />
    </div>
  );
}
