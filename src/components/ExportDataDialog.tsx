import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types/task';
import { Transaction, Debt, Budget, TransactionCategory } from '@/types/finance';
import {
  exportTasks,
  exportTransactions,
  exportDebts,
  exportBudgets,
  exportAllData,
} from '@/utils/exportData';

interface ExportDataDialogProps {
  tasks: Task[];
  transactions: Transaction[];
  debts: Debt[];
  budgets: Budget[];
  categories: TransactionCategory[];
}

export function ExportDataDialog({
  tasks,
  transactions,
  debts,
  budgets,
  categories,
}: ExportDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [selectedData, setSelectedData] = useState({
    tasks: true,
    transactions: true,
    debts: true,
    budgets: true,
  });
  const { toast } = useToast();

  const handleExport = () => {
    const selected = Object.entries(selectedData).filter(([_, v]) => v).map(([k]) => k);
    
    if (selected.length === 0) {
      toast({
        title: 'No data selected',
        description: 'Please select at least one data type to export',
        variant: 'destructive',
      });
      return;
    }

    // If all selected, export as combined file
    if (selected.length === 4) {
      exportAllData(tasks, transactions, debts, budgets, categories, format);
    } else {
      // Export individually
      if (selectedData.tasks) exportTasks(tasks, format);
      if (selectedData.transactions) exportTransactions(transactions, categories, format);
      if (selectedData.debts) exportDebts(debts, format);
      if (selectedData.budgets) exportBudgets(budgets, categories, format);
    }

    toast({
      title: 'Export complete',
      description: `Your data has been exported as ${format.toUpperCase()}`,
    });
    setOpen(false);
  };

  const dataOptions = [
    { id: 'tasks', label: 'Tasks', count: tasks.length },
    { id: 'transactions', label: 'Transactions', count: transactions.length },
    { id: 'debts', label: 'Debts', count: debts.length },
    { id: 'budgets', label: 'Budgets', count: budgets.length },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as 'json' | 'csv')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4 text-amber-500" />
                  JSON
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  CSV
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Data to Export</Label>
            <div className="space-y-2">
              {dataOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedData[option.id as keyof typeof selectedData]}
                    onCheckedChange={(checked) =>
                      setSelectedData((prev) => ({
                        ...prev,
                        [option.id]: checked,
                      }))
                    }
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {option.count} items
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
