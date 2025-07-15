import { ErrorCode, AppError, errorMessages } from '@/types/errors';

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle axios errors
  if (error.isAxiosError) {
    if (!error.response) {
      return new AppError(
        ErrorCode.API_NETWORK_ERROR,
        errorMessages[ErrorCode.API_NETWORK_ERROR]
      );
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        return new AppError(
          ErrorCode.AUTH_UNAUTHORIZED,
          data.error || errorMessages[ErrorCode.AUTH_UNAUTHORIZED]
        );
      case 403:
        return new AppError(
          ErrorCode.OPERATION_UNAUTHORIZED,
          data.error || errorMessages[ErrorCode.OPERATION_UNAUTHORIZED]
        );
      case 404:
        return new AppError(
          ErrorCode.RESOURCE_NOT_FOUND,
          data.error || errorMessages[ErrorCode.RESOURCE_NOT_FOUND]
        );
      case 409:
        return new AppError(
          ErrorCode.RESOURCE_ALREADY_EXISTS,
          data.error || errorMessages[ErrorCode.RESOURCE_ALREADY_EXISTS]
        );
      case 422:
        return new AppError(
          ErrorCode.VALIDATION_ERROR,
          data.error || errorMessages[ErrorCode.VALIDATION_ERROR],
          data.details
        );
      default:
        return new AppError(
          ErrorCode.API_ERROR,
          data.error || errorMessages[ErrorCode.API_ERROR]
        );
    }
  }

  // Handle other types of errors
  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    error.message || errorMessages[ErrorCode.UNKNOWN_ERROR]
  );
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
