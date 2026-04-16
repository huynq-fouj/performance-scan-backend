export interface ApiResponse<T = any> {
  message?: string;
  count?: number;
  data?: T;
  status?: string;
  code?: number;
}
