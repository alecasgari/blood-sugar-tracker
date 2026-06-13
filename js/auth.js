import { login, register, saveSession, extractAuthResult, getPasswordResetTelegramUrl } from './api.js';
import { showToast } from './toast.js';
import { renderHoneypotField, readHoneypot, blockIfHoneypot } from './honeypot.js';

export function renderAuth() {
  return `
    <div class="auth-bg min-h-screen flex items-center justify-center px-4 py-10 page-enter">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/30 mb-4">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.5 9.75l-2.25 2.25M4.5 9.75l2.25 2.25" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-800">قند خون</h1>
          <p class="text-sm text-slate-500 mt-1">ثبت و پیگیری هوشمند قند خون</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <!-- Tabs -->
          <div class="flex border-b border-slate-100">
            <button id="tab-login" data-tab="login"
              class="auth-tab flex-1 py-3.5 text-sm font-semibold text-brand-600 border-b-2 border-brand-600 transition-colors">
              ورود
            </button>
            <button id="tab-register" data-tab="register"
              class="auth-tab flex-1 py-3.5 text-sm font-semibold text-slate-400 border-b-2 border-transparent transition-colors">
              ثبت‌نام
            </button>
          </div>

          <div class="p-6">
            <!-- Login Form -->
            <form id="form-login" class="space-y-4 relative">
              ${renderHoneypotField()}
              <div>
                <label for="login-email" class="block text-sm font-medium text-slate-700 mb-1.5">ایمیل</label>
                <input id="login-email" type="email" required autocomplete="email"
                  placeholder="example@email.com"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label for="login-password" class="block text-sm font-medium text-slate-700">رمز عبور</label>
                  <a id="link-forgot-password" href="${getPasswordResetTelegramUrl()}" target="_blank" rel="noopener noreferrer"
                    class="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
                    فراموش کردید؟
                  </a>
                </div>
                <input id="login-password" type="password" required autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
              </div>
              <p class="text-xs text-slate-400 -mt-2">
                برای بازیابی رمز، از طریق
                <a id="link-support-telegram" href="${getPasswordResetTelegramUrl()}" target="_blank" rel="noopener noreferrer"
                  class="text-brand-600 hover:text-brand-700 font-medium">تلگرام پشتیبانی</a>
                پیام دهید.
              </p>
              <button type="submit" id="btn-login"
                class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span>ورود به حساب</span>
              </button>
            </form>

            <!-- Register Form -->
            <form id="form-register" class="space-y-4 hidden relative">
              ${renderHoneypotField()}
              <div>
                <label for="register-email" class="block text-sm font-medium text-slate-700 mb-1.5">ایمیل</label>
                <input id="register-email" type="email" required autocomplete="email"
                  placeholder="example@email.com"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
              </div>
              <div>
                <label for="register-password" class="block text-sm font-medium text-slate-700 mb-1.5">رمز عبور</label>
                <input id="register-password" type="password" required autocomplete="new-password" minlength="6"
                  placeholder="حداقل ۶ کاراکتر"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
              </div>
              <button type="submit" id="btn-register"
                class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span>ایجاد حساب</span>
              </button>
            </form>
          </div>
        </div>

        <p class="text-center text-xs text-slate-400 mt-6">
          با ورود، شرایط استفاده از سرویس را می‌پذیرید
        </p>
      </div>
    </div>
  `;
}

export function initAuth(onSuccess) {
  let activeTab = 'login';

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  function switchTab(tab) {
    activeTab = tab;
    const isLogin = tab === 'login';

    tabLogin.classList.toggle('text-brand-600', isLogin);
    tabLogin.classList.toggle('border-brand-600', isLogin);
    tabLogin.classList.toggle('text-slate-400', !isLogin);
    tabLogin.classList.toggle('border-transparent', !isLogin);

    tabRegister.classList.toggle('text-brand-600', !isLogin);
    tabRegister.classList.toggle('border-brand-600', !isLogin);
    tabRegister.classList.toggle('text-slate-400', isLogin);
    tabRegister.classList.toggle('border-transparent', isLogin);

    formLogin.classList.toggle('hidden', !isLogin);
    formRegister.classList.toggle('hidden', isLogin);
  }

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  const loginEmail = document.getElementById('login-email');
  const forgotLink = document.getElementById('link-forgot-password');
  const supportLink = document.getElementById('link-support-telegram');

  function updateForgotPasswordLinks() {
    const url = getPasswordResetTelegramUrl(loginEmail?.value.trim() || '');
    forgotLink?.setAttribute('href', url);
    supportLink?.setAttribute('href', url);
  }

  loginEmail?.addEventListener('input', updateForgotPasswordLinks);
  updateForgotPasswordLinks();

  async function handleAuthSubmit(e, type) {
    e.preventDefault();

    const isLoginForm = type === 'login';
    const form = isLoginForm ? formLogin : formRegister;
    const btn = document.getElementById(isLoginForm ? 'btn-login' : 'btn-register');

    if (blockIfHoneypot(readHoneypot(form))) return;

    const email = document.getElementById(isLoginForm ? 'login-email' : 'register-email').value.trim();
    const password = document.getElementById(isLoginForm ? 'login-password' : 'register-password').value;
    const honeypot = readHoneypot(form);

    if (!email || !password) {
      showToast('لطفاً تمام فیلدها را پر کنید', 'error');
      return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';

    try {
      const data = isLoginForm
        ? await login(email, password, honeypot)
        : await register(email, password, honeypot);

      const { success, userId, email: returnedEmail } = extractAuthResult(data);

      if (!success) {
        throw new Error(data?.message || 'عملیات ناموفق بود');
      }

      saveSession(userId, returnedEmail || email);
      showToast(isLoginForm ? 'خوش آمدید!' : 'حساب شما با موفقیت ایجاد شد', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message || 'خطا در ارتباط با سرور', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }

  formLogin.addEventListener('submit', (e) => handleAuthSubmit(e, 'login'));
  formRegister.addEventListener('submit', (e) => handleAuthSubmit(e, 'register'));
}
