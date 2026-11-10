export interface IProblemFieldError {
  path: Array<string | number>;
  code: string;
  message: string;
}

export interface IProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  instance: string;
  requestId: string | null;
  errors?: IProblemFieldError[];
  currentVersion?: number;
}
