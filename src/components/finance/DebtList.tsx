import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Clock, AlertTriangle, Pencil } from 'lucide-react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Debt, DebtType } from '@/types/finance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DebtListProps {
  debts: Debt[];
  onAddDebt: (
    personName: string,
    type: DebtType,
    amount: number,
    description?: string,
    dueDate?: Date
  ) => void;
  onUpdateDebt: (
    id: string,
    personName: string,
    type: DebtType,
    originalAmount: number,
    description?: string,
    dueDate?: Date
  ) => void;
  onAddPayment: (debtId: string, amount: number, note?: string) => void;
  onDeleteDebt: (id: string) => void;
}

export function DebtList({
  debts,
  onAddDebt,
  onUpdateDebt,
  onAddPayment,
  onDeleteDebt,
}: DebtListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<DebtType>('i_owe');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('active');
  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null);

  const debtToDelete = deleteDebtId ? debts.find(d => d.id === deleteDebtId) : null;

  const resetForm = () => {
    setPersonName('');
    setType('i_owe');
    setAmount('');
    setDescription('');
    setDueDate(undefined);
    setEditingDebt(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    setPersonName(debt.personName);
    setType(debt.type);
    setAmount(debt.originalAmount.toString());
    setDescription(debt.description || '');
    setDueDate(debt.dueDate);
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (!personName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingDebt) {
      onUpdateDebt(
        editingDebt.id,
        personName,
        type,
        parsedAmount,
        description || undefined,
        dueDate
      );
    } else {
      onAddDebt(personName, type, parsedAmount, description || undefined, dueDate);
    }

    resetForm();
    setIsOpen(false);
  };

  const handlePayment = (debtId: string) => {
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddPayment(debtId, parsedAmount, paymentNote || undefined);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const filteredDebts = debts.filter(d => {
    if (filter === 'active') return !d.isSettled;
    if (filter === 'settled') return d.isSettled;
    return true;
  });

  const isOverdue = (debt: Debt) => {
    return !debt.isSettled && debt.dueDate && debt.dueDate < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Debts</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Debt
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDebt ? 'Edit Debt' : 'Add Debt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Button
                variant={type === 'i_owe' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  type === 'i_owe' && "bg-red-500 hover:bg-red-600"
                )}
                onClick={() => setType('i_owe')}
              >
                I Owe
              </Button>
              <Button
                variant={type === 'owed_to_me' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  type === 'owed_to_me' && "bg-green-500 hover:bg-green-600"
                )}
                onClick={() => setType('owed_to_me')}
              >
                Owed to Me
              </Button>
            </div>

            <Input
              placeholder="Person's name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />

            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  {dueDate ? format(dueDate, 'PPP') : 'Set due date (optional)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleSubmit} className="w-full">
              {editingDebt ? 'Save Changes' : 'Add Debt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {filteredDebts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No debts found
            </CardContent>
          </Card>
        ) : (
          filteredDebts.map(debt => (
            <Collapsible
              key={debt.id}
              open={expandedDebt === debt.id}
              onOpenChange={(open) => setExpandedDebt(open ? debt.id : null)}
            >
              <Card className={cn(
                debt.isSettled && "opacity-60",
                isOverdue(debt) && "border-destructive/50"
              )}>
                <CollapsibleTrigger className="w-full">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                        debt.type === 'owed_to_me' ? "bg-green-500" : "bg-red-500"
                      )}>
                        {debt.personName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{debt.personName}</p>
                          {isOverdue(debt) && (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )}
                          {debt.isSettled && (
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">
                              Settled
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {debt.type === 'owed_to_me' ? 'Owes you' : 'You owe'}
                          </span>
                          {debt.dueDate && (
                            <>
                              <span>•</span>
                              <span className={isOverdue(debt) ? "text-destructive" : ""}>
                                Due {format(debt.dueDate, 'MMM d, yyyy')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={cn(
                          "font-semibold",
                          debt.type === 'owed_to_me' ? "text-green-500" : "text-red-500"
                        )}>
                          {formatCurrency(debt.remainingAmount)}
                        </p>
                        {debt.remainingAmount !== debt.originalAmount && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatCurrency(debt.originalAmount)}
                          </p>
                        )}
                      </div>
                      {expandedDebt === debt.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 border-t">
                    {debt.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {debt.description}
                      </p>
                    )}

                    {/* Payment history */}
                    {debt.payments && debt.payments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Payment History</h4>
                        <div className="space-y-1">
                          {debt.payments.map(payment => (
                            <div 
                              key={payment.id} 
                              className="flex justify-between text-sm py-1 border-b border-dashed"
                            >
                              <div>
                                <span className="text-muted-foreground">
                                  {format(payment.paidAt, 'MMM d, yyyy')}
                                </span>
                                {payment.note && (
                                  <span className="ml-2 text-muted-foreground">
                                    - {payment.note}
                                  </span>
                                )}
                              </div>
                              <span className="text-green-500 font-medium">
                                -{formatCurrency(payment.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add payment form */}
                    {!debt.isSettled && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Record Payment</h4>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Note (optional)"
                            value={paymentNote}
                            onChange={(e) => setPaymentNote(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={() => handlePayment(debt.id)}>
                            Record
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(debt)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteDebtId(debt.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteDebtId}
        onOpenChange={(open) => !open && setDeleteDebtId(null)}
        onConfirm={() => {
          if (deleteDebtId) {
            onDeleteDebt(deleteDebtId);
            setDeleteDebtId(null);
          }
        }}
        title="Delete Debt"
        itemName={debtToDelete?.personName}
        description={`Are you sure you want to delete this debt with ${debtToDelete?.personName}? This will also remove all payment history.`}
      />
    </div>
  );
}
