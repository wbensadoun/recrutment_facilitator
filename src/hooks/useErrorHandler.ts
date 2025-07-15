import { useToast } from '@/hooks/use-toast';
import { isAppError } from '@/utils/error-handler';
import { ErrorCode } from '@/types/errors';
import { useCallback } from 'react';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const { showToast = true, onError } = options;

  const handleError = useCallback((error: unknown) => {
    if (isAppError(error)) {
      // Handle specific error types
      switch (error.code) {
        case ErrorCode.AUTH_INVALID_CREDENTIALS:
        case ErrorCode.AUTH_UNAUTHORIZED:
        case ErrorCode.AUTH_TOKEN_EXPIRED:
          if (showToast) {
            toast({
              title: 'Authentication Error',
              description: error.message,
              variant: 'destructive',
            });
          }
          break;

        case ErrorCode.RESOURCE_NOT_FOUND:
        case ErrorCode.RESOURCE_ALREADY_EXISTS:
        case ErrorCode.RESOURCE_INVALID:
          if (showToast) {
            toast({
              title: 'Resource Error',
              description: error.message,
              variant: 'destructive',
            });
          }
          break;

        case ErrorCode.API_NETWORK_ERROR:
        case ErrorCode.API_TIMEOUT:
          if (showToast) {
            toast({
              title: 'Network Error',
              description: error.message,
              variant: 'destructive',
            });
          }
          break;

        case ErrorCode.VALIDATION_ERROR:
          if (showToast) {
            toast({
              title: 'Validation Error',
              description: error.message,
              variant: 'destructive',
            });
          }
          break;

        default:
          if (showToast) {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
          }
      }
    } else {
      // Handle unknown errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (showToast) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }

    // Call the onError callback if provided
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [toast, showToast, onError]);

  return handleError;
}
