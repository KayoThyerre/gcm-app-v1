import { api } from "../services/api";
import type { User } from "../types/User";

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>("/users");
  return response.data;
}

export async function approveUser(userId: string): Promise<User> {
  const response = await api.patch<User>(`/users/${userId}/status`, {
    status: "ACTIVE",
  });

  return response.data;
}

export async function rejectUser(userId: string): Promise<User> {
  const response = await api.patch<User>(`/users/${userId}/status`, {
    status: "INACTIVE",
  });

  return response.data;
}
