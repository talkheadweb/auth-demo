export type ApiErrorMessage = {
  path?: string;
  message: string;
};

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  statusCode: number;
  message: string;
  data?: T;
};

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
  errorMessages?: ApiErrorMessage[];
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type UserRole = "user" | "admin";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
};
