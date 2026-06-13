import { getUserEmail, getUserId, clearSession, changePassword } from './api.js';
import { showToast } from './toast.js';
import { renderHoneypotField, readHoneypot, blockIfHoneypot } from './honeypot.js';

export function renderProfile() {
  const email = getUserEmail() || 'کاربر';

  return `
    <div class="page-enter max-w-lg mx-auto px-4 pt-20 pb-28">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-slate-800">پروفایل</h2>
        <p class="text-sm text-slate-500 mt-1">اطلاعات حساب کاربری</p>
      </div>

      <!-- Avatar Card -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center mb-4">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-2xl font-bold shadow-lg shadow-brand-500/25 mb-4">
          ${email.charAt(0).toUpperCase()}
        </div>
        <h3 class="font-semibold text-slate-800 text-lg">${email}</h3>
        <p class="text-xs text-slate-400 mt-1">حساب فعال</p>
      </div>

      <!-- Info Cards -->
      <div class="space-y-3 mb-4">
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-slate-400">ایمیل</p>
            <p class="text-sm font-medium text-slate-700">${email}</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-slate-400">وضعیت</p>
            <p class="text-sm font-medium text-emerald-600">متصل به سرور</p>
          </div>
        </div>
      </div>

      <!-- Change Password -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
        <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          تغییر رمز عبور
        </h3>
        <form id="form-change-password" class="space-y-3 relative">
          ${renderHoneypotField()}
          <div>
            <label for="current-password" class="block text-xs font-medium text-slate-600 mb-1.5">رمز فعلی</label>
            <input id="current-password" type="password" required autocomplete="current-password"
              placeholder="رمز فعلی"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
          </div>
          <div>
            <label for="new-password" class="block text-xs font-medium text-slate-600 mb-1.5">رمز جدید</label>
            <input id="new-password" type="password" required autocomplete="new-password" minlength="6"
              placeholder="حداقل ۶ کاراکتر"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
          </div>
          <div>
            <label for="confirm-password" class="block text-xs font-medium text-slate-600 mb-1.5">تکرار رمز جدید</label>
            <input id="confirm-password" type="password" required autocomplete="new-password" minlength="6"
              placeholder="تکرار رمز جدید"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
          </div>
          <button type="submit" id="btn-change-password"
            class="btn-press w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            ذخیره رمز جدید
          </button>
        </form>
      </div>

      <!-- Logout -->
      <button id="btn-logout"
        class="btn-press w-full py-3.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        <span>خروج از حساب</span>
      </button>
    </div>
  `;
}

export function initProfile(onLogout) {
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    clearSession();
    onLogout();
  });

  const form = document.getElementById('form-change-password');
  const btn = document.getElementById('btn-change-password');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (blockIfHoneypot(readHoneypot(form))) return;

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword.length < 6) {
      showToast('رمز جدید باید حداقل ۶ کاراکتر باشد', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('رمز جدید و تکرار آن یکسان نیست', 'error');
      return;
    }
    if (currentPassword === newPassword) {
      showToast('رمز جدید باید با رمز فعلی متفاوت باشد', 'error');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      showToast('لطفاً دوباره وارد شوید', 'error');
      return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';

    try {
      await changePassword(userId, currentPassword, newPassword, readHoneypot(form));
      form.reset();
      showToast('رمز عبور با موفقیت تغییر کرد', 'success');
    } catch (err) {
      showToast(err.message || 'خطا در تغییر رمز', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });
}
