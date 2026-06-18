export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly data: T;
  public readonly message?: string;
  public readonly meta?: PaginatedMeta;

  constructor(success: boolean, data: T, message?: string, meta?: PaginatedMeta) {
    this.success = success;
    this.data = data;
    if (message) this.message = message;
    if (meta) this.meta = meta;
  }

  static success<T>(data: T, message?: string, meta?: PaginatedMeta): ApiResponse<T> {
    return new ApiResponse(true, data, message, meta);
  }

  static error(message: string, errors?: any): { success: boolean; message: string; errors?: any } {
    return {
      success: false,
      message,
      ...(errors && { errors })
    };
  }
}
export default ApiResponse;
