export interface SuccessResponse<T = any> {
  status_code: number
  message: string
  data?: T
}

export function successResponse<T = any>(
  data?: T,
  message: string = 'Success',
  statusCode: number = 200,
): SuccessResponse<T> {
  return {
    status_code: statusCode,
    message,
    data,
  }
}

export interface ErrorResponse {
  status_code: number
  message: string
  error: string | any
}

export function errorResponse(
  error: string | any,
  message: string = 'An error occurred',
  statusCode: number = 500,
): ErrorResponse {
  return {
    status_code: statusCode,
    message,
    error,
  }
}
