/**
 * Error handling utilities
 * Provides consistent error handling and logging across the application
 */

export interface AppError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    statusCode?: number;
}

/**
 * Create a standardized error response
 */
export function createError(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
): AppError {
    return {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        statusCode
    };
}

/**
 * Log error for debugging
 */
export function logError(error: Error | AppError | unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';

    if (error instanceof Error) {
        console.error(`${timestamp} ${contextStr} Error:`, error.message);
        console.error('Stack:', error.stack);
    } else if (isAppError(error)) {
        console.error(`${timestamp} ${contextStr} AppError [${error.code}]:`, error.message);
        if (error.details) {
            console.error('Details:', error.details);
        }
    } else {
        console.error(`${timestamp} ${contextStr} Unknown error:`, error);
    }
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        'timestamp' in error
    );
}

/**
 * Convert unknown error to user-friendly message
 */
export function getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('fetch')) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        if (error.message.includes('timeout')) {
            return 'The request took too long. Please try again.';
        }
        if (error.message.includes('not found')) {
            return 'The requested resource was not found.';
        }
        return error.message;
    }

    if (isAppError(error)) {
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown, operation: string): AppError {
    logError(error, `Database ${operation}`);

    // Check for specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as { code: string; message?: string };

        // Unique constraint violation
        if (dbError.code === '23505') {
            return createError(
                'DUPLICATE_ENTRY',
                'This record already exists.',
                409,
                { operation }
            );
        }

        // Foreign key violation
        if (dbError.code === '23503') {
            return createError(
                'INVALID_REFERENCE',
                'Referenced record does not exist.',
                400,
                { operation }
            );
        }

        // Not null violation
        if (dbError.code === '23502') {
            return createError(
                'MISSING_REQUIRED_FIELD',
                'Required field is missing.',
                400,
                { operation }
            );
        }
    }

    // Generic database error
    return createError(
        'DATABASE_ERROR',
        'A database error occurred. Please try again.',
        500,
        { operation }
    );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): AppError {
    logError(error, 'Authentication');

    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message: string }).message.toLowerCase();

        if (message.includes('invalid') || message.includes('credentials')) {
            return createError(
                'INVALID_CREDENTIALS',
                'Invalid email or password.',
                401
            );
        }

        if (message.includes('expired')) {
            return createError(
                'SESSION_EXPIRED',
                'Your session has expired. Please sign in again.',
                401
            );
        }

        if (message.includes('unauthorized')) {
            return createError(
                'UNAUTHORIZED',
                'You are not authorized to perform this action.',
                403
            );
        }
    }

    return createError(
        'AUTH_ERROR',
        'Authentication failed. Please try again.',
        401
    );
}

/**
 * Handle file upload errors
 */
export function handleFileUploadError(error: unknown): AppError {
    logError(error, 'File Upload');

    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message: string }).message.toLowerCase();

        if (message.includes('size') || message.includes('large')) {
            return createError(
                'FILE_TOO_LARGE',
                'File size exceeds the maximum allowed.',
                413
            );
        }

        if (message.includes('type') || message.includes('format')) {
            return createError(
                'INVALID_FILE_TYPE',
                'File type is not supported.',
                415
            );
        }
    }

    return createError(
        'UPLOAD_ERROR',
        'File upload failed. Please try again.',
        500
    );
}

/**
 * Retry logic for transient errors
 */
export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            logError(error, `Retry attempt ${attempt}/${maxRetries}`);

            // Don't retry on client errors (4xx)
            if (isAppError(error) && error.statusCode && error.statusCode < 500) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
            }
        }
    }

    throw lastError;
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
): Promise<{ data?: T; error?: AppError }> {
    try {
        const data = await operation();
        return { data };
    } catch (error) {
        logError(error, context);

        // Convert to AppError if not already
        if (isAppError(error)) {
            return { error };
        }

        return {
            error: createError(
                'OPERATION_FAILED',
                getUserFriendlyMessage(error),
                500,
                { context }
            )
        };
    }
}
