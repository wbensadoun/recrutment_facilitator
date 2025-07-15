export enum ErrorCode {
  // Auth errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_INVALID = 'RESOURCE_INVALID',
  
  // Operation errors
  OPERATION_FAILED = 'OPERATION_FAILED',
  OPERATION_UNAUTHORIZED = 'OPERATION_UNAUTHORIZED',
  OPERATION_INVALID = 'OPERATION_INVALID',
  
  // API errors
  API_ERROR = 'API_ERROR',
  API_NETWORK_ERROR = 'API_NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Database errors
  DB_ERROR = 'DB_ERROR',
  
  // Unknown error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMessages: Record<ErrorCode, string> = {
  // Auth errors
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'You are not authorized to perform this action',
  
  // Resource errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'This resource already exists',
  [ErrorCode.RESOURCE_INVALID]: 'The resource data is invalid',
  
  // Operation errors
  [ErrorCode.OPERATION_FAILED]: 'The operation failed to complete',
  [ErrorCode.OPERATION_UNAUTHORIZED]: 'You are not authorized to perform this operation',
  [ErrorCode.OPERATION_INVALID]: 'Invalid operation',
  
  // API errors
  [ErrorCode.API_ERROR]: 'An error occurred while processing your request',
  [ErrorCode.API_NETWORK_ERROR]: 'Network error occurred. Please check your connection',
  [ErrorCode.API_TIMEOUT]: 'The request timed out. Please try again',
  
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'The provided data is invalid',
  
  // Database errors
  [ErrorCode.DB_ERROR]: 'A database error occurred',
  
  // Unknown error
  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred'
};
