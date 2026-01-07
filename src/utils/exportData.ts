import { Task } from '@/types/task';
import { Transaction, Debt, Budget, TransactionCategory } from '@/types/finance';

type ExportFormat = 'json' | 'csv';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function jsonToCsv(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  
  const firstItem = data[0];
  if (!firstItem) return '';

  const headers = Object.keys(firstItem);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

export function exportTasks(tasks: Task[], format: ExportFormat) {
  const exportData = tasks.map(task => ({
    id: task.id,
    title: task.title,
    notes: task.notes || '',
    completed: task.completed,
    completedAt: task.completedAt?.toISOString() || '',
    createdAt: task.createdAt.toISOString(),
    dueDate: task.dueDate?.toISOString() || '',
    when: task.when || '',
    project: task.project || '',
    area: task.area || '',
    recurrenceType: task.recurrenceType || '',
    recurrenceInterval: task.recurrenceInterval || '',
    subtaskCount: task.subtasks?.length || 0,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    downloadFile(JSON.stringify(exportData, null, 2), `tasks-${timestamp}.json`, 'application/json');
  } else {
    downloadFile(jsonToCsv(exportData), `tasks-${timestamp}.csv`, 'text/csv');
  }
}

export function exportTransactions(transactions: Transaction[], categories: TransactionCategory[], format: ExportFormat) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const exportData = transactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    description: t.description || '',
    category: categoryMap.get(t.categoryId || '') || '',
    date: t.date instanceof Date ? t.date.toISOString() : (t.date ? String(t.date) : ''),
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    downloadFile(JSON.stringify(exportData, null, 2), `transactions-${timestamp}.json`, 'application/json');
  } else {
    downloadFile(jsonToCsv(exportData), `transactions-${timestamp}.csv`, 'text/csv');
  }
}

export function exportDebts(debts: Debt[], format: ExportFormat) {
  const exportData = debts.map(d => ({
    id: d.id,
    type: d.type,
    personName: d.personName,
    originalAmount: d.originalAmount,
    remainingAmount: d.remainingAmount,
    description: d.description || '',
    dueDate: d.dueDate instanceof Date ? d.dueDate.toISOString() : (d.dueDate ? String(d.dueDate) : ''),
    isSettled: d.isSettled,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : (d.createdAt ? String(d.createdAt) : ''),
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    downloadFile(JSON.stringify(exportData, null, 2), `debts-${timestamp}.json`, 'application/json');
  } else {
    downloadFile(jsonToCsv(exportData), `debts-${timestamp}.csv`, 'text/csv');
  }
}

export function exportBudgets(budgets: Budget[], categories: TransactionCategory[], format: ExportFormat) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const exportData = budgets.map(b => ({
    id: b.id,
    category: categoryMap.get(b.categoryId || '') || 'Overall',
    amount: b.amount,
    period: b.period,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    downloadFile(JSON.stringify(exportData, null, 2), `budgets-${timestamp}.json`, 'application/json');
  } else {
    downloadFile(jsonToCsv(exportData), `budgets-${timestamp}.csv`, 'text/csv');
  }
}

export function exportAllData(
  tasks: Task[],
  transactions: Transaction[],
  debts: Debt[],
  budgets: Budget[],
  categories: TransactionCategory[],
  format: ExportFormat
) {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const allData = {
    exportedAt: new Date().toISOString(),
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      notes: task.notes || '',
      completed: task.completed,
      completedAt: task.completedAt?.toISOString() || null,
      createdAt: task.createdAt.toISOString(),
      dueDate: task.dueDate?.toISOString() || null,
      when: task.when || null,
      subtasks: task.subtasks || [],
    })),
    transactions: transactions.map(t => ({
      ...t,
      categoryName: categoryMap.get(t.categoryId || '') || null,
    })),
    debts,
    budgets: budgets.map(b => ({
      ...b,
      categoryName: categoryMap.get(b.categoryId || '') || 'Overall',
    })),
    categories,
  };

  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    downloadFile(JSON.stringify(allData, null, 2), `all-data-${timestamp}.json`, 'application/json');
  } else {
    // For CSV, we export each section separately in a zip-like format (just tasks for simplicity)
    const sections = [
      { name: 'tasks', data: allData.tasks },
      { name: 'transactions', data: allData.transactions },
      { name: 'debts', data: allData.debts },
      { name: 'budgets', data: allData.budgets },
    ];
    
    sections.forEach(section => {
      if (section.data.length > 0) {
        downloadFile(jsonToCsv(section.data as Record<string, any>[]), `${section.name}-${timestamp}.csv`, 'text/csv');
      }
    });
  }
}
