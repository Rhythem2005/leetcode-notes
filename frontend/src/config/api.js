/**
 * Centralized API Configuration
 * Uses environment variable VITE_API_URL for the backend base URL
 */

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

console.log(`[API Config] Using BASE_URL: ${BASE_URL}`);

export const API_CONFIG = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};
