
import api, { tokenStorage } from "./api";

export async function createUser(body: { username: string; email: string; password: string }) {
  const { data } = await api.post("/auth/signup", body);
  return data;
}

export async function sendOtp(body: { email: string; purpose?: "verify" | "reset" }) {
  const { data } = await api.post("/auth/otp/send", body);
  return data;
}

export async function resendOtp(body: { email: string }) {
  const { data } = await api.post("/auth/otp/resend", body);
  return data;
}

export async function verifyOtp(body: { email: string; code: string }) {
  const { data } = await api.post("/auth/otp/verify", body);
  return data;
}

export async function userLogin(body: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", body);
  // backend returns { message, token, userId }
  return data;
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
  tokenStorage.clear();
}

export async function forgotPassword(body: { email: string }) {
  const { data } = await api.post("/auth/forgot-password", body);
  return data;
}

export async function resetPassword(body: { uid: string; token: string; newPassword: string }) {
  const { data } = await api.post("/auth/reset-password", body);
  return data;
}

// admin only
export async function getAllUsers() {
  const { data } = await api.get("/auth/users");
  return data.users;
}
