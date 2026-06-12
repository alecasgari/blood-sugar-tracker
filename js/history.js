import { getUserId, fetchHistory } from './api.js';
import { showToast } from './toast.js';
import { getBloodSugarStatus } from './bloodSugar.js';

function renderSkeleton() {
  return `
    <div class="space-y-3" id="history-skeleton">
      ${Array.from({ length: 5 }, () => `
        <div class="skeleton-card">
          <div class="flex items-center justify-between mb-3">
            <div class="skeleton h-4 w-24 rounded-lg"></div>
            <div class="skeleton h-6 w-16 rounded-full"></div>
          </div>
          <div class="skeleton h-8 w-20 rounded-lg mb-2"></div>
          <div class="skeleton h-3 w-full rounded-md"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRecordCard(record) {
  const date = record.Date || record.date || '—';
  const time = record.Time || record.time || '';
  const bloodSugar = record.BloodSugar ?? record.bloodSugar ?? record.value ?? '—';
  const notes = record.Notes || record.notes || '';
  const status = getBloodSugarStatus(bloodSugar);

  return `
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
          </svg>
          <span>${date}${time ? ` · ${time}` : ''}</span>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text} ${status.border} border">
          ${status.label}
        </span>
      </div>

      <div class="flex items-end gap-1.5">
        <span class="text-3xl font-bold ${status.text}">${bloodSugar}</span>
        <span class="text-sm text-slate-400 mb-1">mg/dL</span>
      </div>

      ${notes ? `
        <p class="mt-3 text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
          ${notes}
        </p>
      ` : ''}
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <p class="font-semibold text-slate-600">هنوز رکوردی ثبت نشده</p>
      <p class="text-sm text-slate-400 mt-1">اولین عکس قند خون خود را ثبت کنید</p>
    </div>
  `;
}

export function renderHistory() {
  return `
    <div class="page-enter max-w-lg mx-auto px-4 pt-20 pb-28">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">تاریخچه</h2>
          <p class="text-sm text-slate-500 mt-1">سوابق اندازه‌گیری قند خون</p>
        </div>
        <button id="btn-refresh-history"
          class="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      <div id="history-content">
        ${renderSkeleton()}
      </div>
    </div>
  `;
}

async function loadHistory() {
  const container = document.getElementById('history-content');
  if (!container) return;

  container.innerHTML = renderSkeleton();

  const userId = getUserId();
  if (!userId) {
    showToast('لطفاً دوباره وارد شوید', 'error');
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-500 font-medium mb-3">نشست کاربر منقضی شده است</p>
        <button id="btn-retry-history"
          class="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
          تلاش مجدد
        </button>
      </div>
    `;
    document.getElementById('btn-retry-history')?.addEventListener('click', loadHistory);
    return;
  }

  try {
    const records = await fetchHistory(userId);

    if (!records.length) {
      container.innerHTML = renderEmpty();
      return;
    }

    const sorted = [...records].sort((a, b) => {
      const dateA = `${a.Date || a.date || ''} ${a.Time || a.time || ''}`;
      const dateB = `${b.Date || b.date || ''} ${b.Time || b.time || ''}`;
      return dateB.localeCompare(dateA);
    });

    container.innerHTML = `
      <div class="space-y-3 page-enter">
        ${sorted.map(renderRecordCard).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-500 font-medium mb-3">${err.message || 'خطا در دریافت تاریخچه'}</p>
        <button id="btn-retry-history"
          class="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors">
          تلاش مجدد
        </button>
      </div>
    `;
    document.getElementById('btn-retry-history')?.addEventListener('click', loadHistory);
  }
}

export function initHistory() {
  loadHistory();

  document.getElementById('btn-refresh-history')?.addEventListener('click', () => {
    loadHistory();
    showToast('در حال بروزرسانی...', 'info');
  });
}
