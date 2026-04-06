export type UserRole = "ADMIN" | "USER";

export type UserStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
