export type UserRole = "ADMIN" | "USER" | "SUPERVISOR" | "DEV";

export type UserStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};
