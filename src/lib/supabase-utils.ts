import { PostgrestError } from '@supabase/supabase-js';

// Standard error structure for Supabase operations
export interface SupabaseOperationResult<T> {
    data: T | null;
    error: PostgrestError | null;
}

// Error categories for consistent handling
export type ErrorCategory =
    | 'fetch'
    | 'create'
    | 'update'
    | 'delete'
    | 'auth'
    | 'validation';

// Error handler configuration
interface ErrorHandlerConfig {
    context: string;
    category: ErrorCategory;
    showToast?: boolean;
}

/**
 * Create a standardized error message for user display
 */
export function formatErrorMessage(
    category: ErrorCategory,
    context: string,
    originalMessage?: string
): { title: string; description: string } {
    const actionMap: Record<ErrorCategory, string> = {
        fetch: 'loading',
        create: 'creating',
        update: 'updating',
        delete: 'deleting',
        auth: 'authenticating',
        validation: 'validating',
    };

    return {
        title: `Error ${actionMap[category]} ${context}`,
        description: originalMessage || 'An unexpected error occurred',
    };
}

/**
 * Log error with consistent format
 */
export function logSupabaseError(
    config: ErrorHandlerConfig,
    error: unknown
): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
        `[Supabase ${config.category.toUpperCase()}] ${config.context}:`,
        errorMessage
    );
}

/**
 * Handle Supabase operation with consistent error handling
 * Returns a tuple of [data, error] for easy destructuring
 */
export async function handleSupabaseOperation<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    config: ErrorHandlerConfig
): Promise<{ data: T | null; error: { title: string; description: string } | null }> {
    try {
        const { data, error } = await operation();

        if (error) {
            logSupabaseError(config, error);
            return {
                data: null,
                error: formatErrorMessage(config.category, config.context, error.message),
            };
        }

        return { data, error: null };
    } catch (error) {
        logSupabaseError(config, error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return {
            data: null,
            error: formatErrorMessage(config.category, config.context, message),
        };
    }
}

/**
 * Type guard to check if a value is a PostgrestError
 */
export function isPostgrestError(value: unknown): value is PostgrestError {
    return (
        typeof value === 'object' &&
        value !== null &&
        'message' in value &&
        'code' in value
    );
}
