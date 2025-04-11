export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T | null;
  error?: string | null;
  metadata?: Record<string, any>;
}
