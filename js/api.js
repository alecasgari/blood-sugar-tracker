// ═══════════════════════════════════════════════════════════════════
//  n8n Webhook URLs — آدرس‌های خود را اینجا جایگذاری کنید
// ═══════════════════════════════════════════════════════════════════

import { HONEYPOT_FIELD } from './honeypot.js';

export const WEBHOOK_LOGIN = 'https://n8n.alecasgari.com/webhook/login';
export const WEBHOOK_REGISTER = 'https://n8n.alecasgari.com/webhook/register';
export const WEBHOOK_UPLOAD = 'https://n8n.alecasgari.com/webhook/upload-blood-sugar';
export const WEBHOOK_SAVE_RECORD = 'https://n8n.alecasgari.com/webhook/save-record';
export const WEBHOOK_HISTORY = 'https://n8n.alecasgari.com/webhook/history';
export const WEBHOOK_CHANGE_PASSWORD = 'https://n8n.alecasgari.com/webhook/change-password';

export const SUPPORT_TELEGRAM_URL = 'https://t.me/alecasgari';

export function getPasswordResetTelegramUrl(email = '') {
  const text = [
    'سلام، رمز عبور اپ قند خون را فراموش کرده‌ام.',
    email ? `ایمیل حساب: ${email}` : 'ایمیل حساب: ',
    'لطفاً رمز جدید برایم تنظیم کنید.',
  ].join('\n');
  return `${SUPPORT_TELEGRAM_URL}?text=${encodeURIComponent(text)}`;
}

// ═══════════════════════════════════════════════════════════════════
//  LocalStorage Keys
// ═══════════════════════════════════════════════════════════════════

export const STORAGE_USER_ID = 'bst_userId';
export const STORAGE_USER_EMAIL = 'bst_userEmail';

// ═══════════════════════════════════════════════════════════════════
//  Session Helpers
// ═══════════════════════════════════════════════════════════════════

export function getUserId() {
  return localStorage.getItem(STORAGE_USER_ID);
}

export function getUserEmail() {
  return localStorage.getItem(STORAGE_USER_EMAIL);
}

export function saveSession(userId, email) {
  localStorage.setItem(STORAGE_USER_ID, userId);
  localStorage.setItem(STORAGE_USER_EMAIL, email);
}

export function clearSession() {
  localStorage.removeItem(STORAGE_USER_ID);
  localStorage.removeItem(STORAGE_USER_EMAIL);
}

export function isLoggedIn() {
  return Boolean(getUserId());
}

// ═══════════════════════════════════════════════════════════════════
//  Core Fetch Wrapper
// ═══════════════════════════════════════════════════════════════════

async function request(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('زمان درخواست تمام شد. دوباره تلاش کنید.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  let data;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `خطای سرور (${response.status})`;
    throw new Error(message);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════
//  Auth API
// ═══════════════════════════════════════════════════════════════════

export async function login(email, password, honeypot = '') {
  return request(WEBHOOK_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, [HONEYPOT_FIELD]: honeypot }),
  });
}

export async function register(email, password, honeypot = '') {
  return request(WEBHOOK_REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, [HONEYPOT_FIELD]: honeypot }),
  });
}

export async function changePassword(userId, currentPassword, newPassword, honeypot = '') {
  return request(WEBHOOK_CHANGE_PASSWORD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentPassword, newPassword, [HONEYPOT_FIELD]: honeypot }),
  });
}

// ═══════════════════════════════════════════════════════════════════
//  Blood Sugar Upload
// ═══════════════════════════════════════════════════════════════════

export async function analyzeBloodSugar(userId, imageFile, honeypot = '') {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('image', imageFile, imageFile.name || 'blood-sugar.jpg');
  formData.append('analyzeOnly', 'true');
  formData.append(HONEYPOT_FIELD, honeypot);

  return request(WEBHOOK_UPLOAD, {
    method: 'POST',
    body: formData,
  });
}

export async function saveRecord(userId, { bloodSugar, mealContext, source = 'manual', notes = '' }, honeypot = '') {
  return request(WEBHOOK_SAVE_RECORD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bloodSugar, mealContext, source, notes, [HONEYPOT_FIELD]: honeypot }),
  });
}

// ═══════════════════════════════════════════════════════════════════
//  History
// ═══════════════════════════════════════════════════════════════════

export async function fetchHistory(userId) {
  const data = await request(WEBHOOK_HISTORY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.history)) return data.history;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

// ═══════════════════════════════════════════════════════════════════
//  Response Normalizers
// ═══════════════════════════════════════════════════════════════════

export function extractAuthResult(data) {
  const userId = data?.userId || data?.user_id || data?.id;
  const email = data?.email || '';
  const success = data?.success !== false && Boolean(userId);

  return { success, userId, email };
}
