import { z } from 'zod';

// ============ Task Types ============

export const SubtaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
});

export const TagSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
});

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    notes: z.string().optional(),
    completed: z.boolean(),
    completedAt: z.date().optional(),
    createdAt: z.date(),
    dueDate: z.date().optional(),
    area: z.string().optional(),
    project: z.string().optional(),
    tags: z.array(TagSchema).optional(),
    when: z.enum(['today', 'evening', 'someday']).optional(),
    subtasks: z.array(SubtaskSchema).optional(),
    recurrenceType: z.enum(['daily', 'weekly', 'monthly']).optional(),
    recurrenceInterval: z.number().optional(),
});

export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    areaId: z.string().optional(),
});

export const AreaSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
});

// ============ Finance Types ============

export const TransactionCategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['income', 'expense']),
    color: z.string(),
    icon: z.string().optional(),
});

export const TransactionSchema = z.object({
    id: z.string(),
    categoryId: z.string().optional(),
    type: z.enum(['income', 'expense']),
    amount: z.number(),
    description: z.string().optional(),
    date: z.date(),
    createdAt: z.date(),
});

export const DebtPaymentSchema = z.object({
    id: z.string(),
    debtId: z.string(),
    amount: z.number(),
    note: z.string().optional(),
    paidAt: z.date(),
});

export const DebtSchema = z.object({
    id: z.string(),
    personName: z.string(),
    type: z.enum(['owed_to_me', 'i_owe']),
    originalAmount: z.number(),
    remainingAmount: z.number(),
    description: z.string().optional(),
    dueDate: z.date().optional(),
    isSettled: z.boolean(),
    createdAt: z.date(),
    payments: z.array(DebtPaymentSchema).optional(),
});

export const BudgetSchema = z.object({
    id: z.string(),
    categoryId: z.string().optional(),
    amount: z.number(),
    period: z.enum(['weekly', 'monthly', 'yearly']),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const RecurringTransactionSchema = z.object({
    id: z.string(),
    type: z.enum(['income', 'expense']),
    amount: z.number(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    nextDueDate: z.date(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// ============ Type Exports ============

export type TaskInput = z.infer<typeof TaskSchema>;
export type SubtaskInput = z.infer<typeof SubtaskSchema>;
export type TagInput = z.infer<typeof TagSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type AreaInput = z.infer<typeof AreaSchema>;
export type TransactionInput = z.infer<typeof TransactionSchema>;
export type DebtInput = z.infer<typeof DebtSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;

// ============ Safe Parse Helpers ============

/**
 * Safely parse data with a schema, logging errors but not throwing
 * Returns the original data if parsing fails (for resilience)
 */
export function safeParse<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    context: string
): T | null {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.warn(`[Validation] ${context} failed:`, result.error.issues);
        return null;
    }
    return result.data;
}

/**
 * Parse an array of items, filtering out invalid ones
 */
export function safeParseArray<T>(
    schema: z.ZodSchema<T>,
    data: unknown[],
    context: string
): T[] {
    return data
        .map((item, index) => safeParse(schema, item, `${context}[${index}]`))
        .filter((item): item is T => item !== null);
}
