export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string | null;
  code: string | null;
  fieldErrors: FieldError[];
  retryAfterSeconds: number | null;
}
