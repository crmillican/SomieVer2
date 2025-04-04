/**
 * User-friendly error handling library
 * Designed for non-technical users with simple, actionable error messages
 */

export interface FriendlyError {
  message: string;
  action: string;
  severity: 'info' | 'warning' | 'error';
  fieldErrors?: Record<string, string>;
  retryable: boolean;
  code?: string;
  originalError?: Error;
}

// Custom error mapping for nano influencers and business owners
const errorMapping: Record<string, Omit<FriendlyError, 'originalError'>> = {
  // Authentication errors
  'auth/token-expired': {
    message: "Your session timed out",
    action: "Please refresh the page to continue",
    severity: "warning",
    retryable: true
  },
  'auth/not-authenticated': {
    message: "You need to be logged in",
    action: "Please log in to continue",
    severity: "warning",
    retryable: false
  },
  'auth/invalid-credentials': {
    message: "Your login details don't match our records",
    action: "Please check your username and password",
    severity: "error",
    retryable: true
  },

  // Profile errors
  'profile/not-found': {
    message: "Your profile information is missing",
    action: "Let's create your profile to get started",
    severity: "info",
    retryable: false
  },
  'profile/invalid-data': {
    message: "Some profile information is missing or incorrect",
    action: "Please check the highlighted fields",
    severity: "warning",
    retryable: true,
    fieldErrors: {}
  },

  // Social media connection errors
  'social/connection-failed': {
    message: "We couldn't connect to your social account",
    action: "Please try connecting again or use a different account",
    severity: "warning",
    retryable: true
  },
  'social/invalid-handle': {
    message: "We couldn't find this social media account",
    action: "Please check the account name and try again",
    severity: "warning",
    retryable: true
  },
  'social/metrics-unavailable': {
    message: "We couldn't get your follower count",
    action: "Please make sure your account is public and try again",
    severity: "warning",
    retryable: true
  },

  // Offer errors
  'offers/invalid-parameters': {
    message: "Some offer details are missing",
    action: "Please complete all the required information",
    severity: "warning",
    retryable: true
  },
  'offers/creation-failed': {
    message: "We couldn't create your offer",
    action: "Please try again in a few moments",
    severity: "error",
    retryable: true
  },
  'offers/not-found': {
    message: "This offer is no longer available",
    action: "Please try another offer or create a new one",
    severity: "info",
    retryable: false
  },

  // Network errors
  'network/connection-failed': {
    message: "Internet connection issue",
    action: "Please check your internet and try again",
    severity: "error",
    retryable: true
  },
  'network/timeout': {
    message: "This is taking longer than expected",
    action: "Please try again in a few moments",
    severity: "warning",
    retryable: true
  },

  // Generic errors
  'unknown/server-error': {
    message: "Something went wrong on our end",
    action: "Please try again in a few moments",
    severity: "error",
    retryable: true
  },
  'unknown/client-error': {
    message: "Something went wrong",
    action: "Please refresh the page and try again",
    severity: "error",
    retryable: true
  }
};

/**
 * Get user-friendly error information from an error
 * 
 * @param error The original error
 * @param defaultCode Optional default error code
 * @returns User-friendly error object
 */
export function getFriendlyError(error: any, defaultCode: string = 'unknown/client-error'): FriendlyError {
  // Extract error code if available
  const errorCode = (error as any)?.code || defaultCode;
  
  // Get mapped error info or use default
  const errorInfo = errorMapping[errorCode] || errorMapping['unknown/client-error'];
  
  // Handle field errors for form validation
  let fieldErrors = errorInfo.fieldErrors || {};
  if ((error as any)?.details && typeof (error as any).details === 'object') {
    fieldErrors = {
      ...fieldErrors,
      ...(error as any).details
    };
  }
  
  // Return complete friendly error
  return {
    ...errorInfo,
    fieldErrors,
    code: errorCode,
    originalError: error instanceof Error ? error : new Error(String(error))
  };
}

/**
 * Show a user-friendly toast notification for an error
 */
export function showErrorToast(toast: any, error: any, defaultCode?: string) {
  const friendlyError = getFriendlyError(error, defaultCode);
  
  toast({
    title: friendlyError.message,
    description: friendlyError.action,
    variant: friendlyError.severity === 'error' ? 'destructive' : 
             friendlyError.severity === 'warning' ? 'warning' : 'default'
  });
}

/**
 * Format field-specific error messages for forms
 */
export function getFieldErrorMessage(fieldErrors: Record<string, string> | undefined, field: string): string | undefined {
  if (!fieldErrors) return undefined;
  
  // Simple field name matching
  if (fieldErrors[field]) return fieldErrors[field];
  
  // Check for nested field errors (e.g., "address.city")
  const nestedKeys = Object.keys(fieldErrors).filter(key => key.startsWith(`${field}.`));
  if (nestedKeys.length > 0) {
    return fieldErrors[nestedKeys[0]];
  }
  
  return undefined;
}

/**
 * Create a simplified error object for logging
 */
export function logErrorInfo(error: any): object {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      status: (error as any).status,
      details: (error as any).details
    };
  }
  
  return { error: String(error) };
}