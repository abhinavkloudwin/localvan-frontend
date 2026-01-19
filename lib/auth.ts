import { apiClient } from "./api-client";
import type { User } from "./types";

export const isAuthenticated = (): boolean => {
  return !!apiClient.getToken();
};

export const getUserFromToken = async (): Promise<User | null> => {
  try {
    if (!isAuthenticated()) return null;
    return await apiClient.getProfile();
  } catch (error) {
    console.error("Failed to get user from token:", error);
    apiClient.removeToken();
    return null;
  }
};

export const logout = (): void => {
  apiClient.logout();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
};

export const checkAdminRole = (user: User | null): boolean => {
  return user?.role === "admin";
};
