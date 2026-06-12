import { getUserId, fetchHistory } from './api.js';
import { showToast } from './toast.js';
import {
  getBloodSugarStatus,
  parseBloodSugarValue,
  getRecordMealContextId,
  isInTargetRange,
} from './bloodSugar.js';
import { MEAL_CONTEXTS } from './mealContext.js';
import { dedupeRecords } from './records.js';

let chartInstances = [];

function destroyCharts() {
  chartInstances.forEach((c) => c.destroy());
  chartInstances = [];
}

function renderSkeleton() {
  return `
    <div class="space-y-4">
      ${Array.from({ length: 4 }, () => `
        <div class="skeleton-card"><div class="skeleton h-24 w-full rounded-xl"></div></div>
      `).join('')}
    </div>
  `;
}

function computeStats(records) {
  const valid = records
    .map((r) => ({
      value: parseBloodSugarValue(r),
      mealContext: getRecordMealContextId(r),
      date: r.Date || r.date || '',
      time: r.Time || r.time || '',
      createdAt: r.createdAt || '',
    }))
    .filter((r) => r.value != null);

  if (!valid.length) return null;

  const values = valid.map((r) => r.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const inRange = valid.filter((r) =>
    r.mealContext ? isInTargetRange(r.value, r.mealContext) : r.value >= 70 && r.value <= 140
  ).length;
  const inRangePct = Math.round((inRange / valid.length) * 100);

  const byContext = {};
  MEAL_CONTEXTS.forEach((c) => { byContext[c.id] = { count: 0, sum: 0, inRange: 0 }; });
  byContext.unknown = { count: 0, sum: 0, inRange: 0 };

  valid.forEach((r) => {
    const key = r.mealContext && byContext[r.mealContext] ? r.mealContext : 'unknown';
    byContext[key].count += 1;
    byContext[key].sum += r.value;
    if (r.mealContext ? isInTargetRange(r.value, r.mealContext) : r.value >= 70 && r.value <= 140) {
      byContext[key].inRange += 1;
    }
  });

  const statusCounts = { low: 0, normal: 0, high: 0 };
  valid.forEach((r) => {
    const status = getBloodSugarStatus(r.value, r.mealContext || undefined);
    if (status.label === 'پایین') statusCounts.low += 1;
    else if (status.label === 'بالا') statusCounts.high += 1;
    else statusCounts.normal += 1;
  });

  const sorted = [...valid].sort((a, b) => {
    const da = a.createdAt || `${a.date} ${a.time}`;
    const db = b.createdAt || `${b.date} ${b.time}`;
    return da.localeCompare(db);
  });

  const recent7 = sorted.slice(-7);
  const avg7 = recent7.length
    ? Math.round(recent7.reduce((s, r) => s + r.value, 0) / recent7.length)
    : null;

  return {
    total: valid.length,
    avg,
    min,
    max,
    inRangePct,
    byContext,
    statusCounts,
    trend: sorted.slice(-20),
    avg7,
  };
}

function buildInsights(stats) {
  const lines = [];
  lines.push(`تا الان ${stats.total} اندازه‌گیری معتبر ثبت شده است.`);

  if (stats.inRangePct >= 70) {
    lines.push(`${stats.inRangePct}٪ اندازه‌گیری‌ها در محدوده هدف بوده‌اند — وضعیت کلی خوب است.`);
  } else if (stats.inRangePct >= 50) {
    lines.push(`${stats.inRangePct}٪ در محدوده هدف — روند قابل بهبود است؛ الگوی وعده‌ها را بررسی کنید.`);
  } else {
    lines.push(`فقط ${stats.inRangePct}٪ در محدوده هدف — توصیه می‌شود با پزشک مشورت کنید.`);
  }

  if (stats.avg7 != null) {
    const diff = stats.avg7 - stats.avg;
    if (Math.abs(diff) >= 10) {
      lines.push(diff > 0
        ? `میانگین ۷ روز اخیر (${stats.avg7}) بالاتر از میانگین کل (${stats.avg}) است.`
        : `میانگین ۷ روز اخیر (${stats.avg7}) پایین‌تر از میانگین کل (${stats.avg}) است.`);
    }
  }

  if (stats.statusCounts.high > stats.total * 0.3) {
    lines.push('تعداد اندازه‌گیری‌های بالا نسبتاً زیاد است — زمان‌بندی بعد از غذا را دقیق‌تر ثبت کنید.');
  }
  if (stats.statusCounts.low > 0) {
    lines.push(`${stats.statusCounts.low} مورد قند پایین ثبت شده — به علائم هیپوگلیسمی توجه کنید.`);
  }

  return lines;
}

function renderStatCards(stats) {
  return `
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <p class="text-xs text-slate-500">میانگین</p>
        <p class="text-2xl font-bold text-slate-800 mt-1">${stats.avg}</p>
        <p class="text-xs text-slate-400">mg/dL</p>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <p class="text-xs text-slate-500">در محدوده هدف</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">${stats.inRangePct}٪</p>
        <p class="text-xs text-slate-400">${stats.total} اندازه‌گیری</p>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <p class="text-xs text-slate-500">کمترین</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">${stats.min}</p>
        <p class="text-xs text-slate-400">mg/dL</p>
      </div>
      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <p class="text-xs text-slate-500">بیشترین</p>
        <p class="text-2xl font-bold text-red-600 mt-1">${stats.max}</p>
        <p class="text-xs text-slate-400">mg/dL</p>
      </div>
    </div>
  `;
}

function renderContextBreakdown(stats) {
  const rows = MEAL_CONTEXTS.map((ctx) => {
    const data = stats.byContext[ctx.id];
    if (!data?.count) return '';
    const avg = Math.round(data.sum / data.count);
    const pct = Math.round((data.inRange / data.count) * 100);
    return `
      <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
        <div>
          <p class="text-sm font-medium text-slate-700">${ctx.label}</p>
          <p class="text-xs text-slate-400">${data.count} مورد · میانگین ${avg}</p>
        </div>
        <span class="text-xs font-semibold px-2 py-1 rounded-full ${pct >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">${pct}٪ هدف</span>
      </div>
    `;
  }).filter(Boolean).join('');

  if (!rows) {
    return '<p class="text-sm text-slate-400 text-center py-4">هنوز زمان‌بندی وعده ثبت نشده</p>';
  }

  return `<div class="divide-y divide-slate-50">${rows}</div>`;
}

function initCharts(stats) {
  if (typeof Chart === 'undefined') return;

  destroyCharts();

  const trendEl = document.getElementById('chart-trend');
  if (trendEl && stats.trend.length) {
    const labels = stats.trend.map((r, i) => {
      if (r.date) return r.time ? `${r.date} ${r.time}` : r.date;
      return `#${i + 1}`;
    });
    const data = stats.trend.map((r) => r.value);

    chartInstances.push(new Chart(trendEl, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'قند خون (mg/dL)',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, suggestedMin: 50, suggestedMax: 200 },
          x: { ticks: { maxRotation: 45, font: { size: 10 } } },
        },
      },
    }));
  }

  const statusEl = document.getElementById('chart-status');
  if (statusEl) {
    chartInstances.push(new Chart(statusEl, {
      type: 'doughnut',
      data: {
        labels: ['پایین', 'نرمال', 'بالا'],
        datasets: [{
          data: [stats.statusCounts.low, stats.statusCounts.normal, stats.statusCounts.high],
          backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Vazirmatn' } } } },
      },
    }));
  }

  const contextEl = document.getElementById('chart-context');
  if (contextEl) {
    const ctxData = MEAL_CONTEXTS
      .map((c) => ({ label: c.label, count: stats.byContext[c.id]?.count || 0 }))
      .filter((c) => c.count > 0);

    if (ctxData.length) {
      chartInstances.push(new Chart(contextEl, {
        type: 'bar',
        data: {
          labels: ctxData.map((c) => c.label),
          datasets: [{
            label: 'تعداد',
            data: ctxData.map((c) => c.count),
            backgroundColor: '#93c5fd',
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      }));
    }
  }
}

function renderReportContent(stats) {
  const insights = buildInsights(stats);

  return `
    <div class="space-y-5 page-enter">
      ${renderStatCards(stats)}

      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">روند اندازه‌گیری‌ها</h3>
        <div class="h-52"><canvas id="chart-trend"></canvas></div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">توزیع وضعیت</h3>
          <div class="h-44"><canvas id="chart-status"></canvas></div>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <h3 class="text-sm font-semibold text-slate-700 mb-3">بر اساس زمان وعده</h3>
          <div class="h-44"><canvas id="chart-context"></canvas></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-700 mb-3">جزئیات زمان‌بندی</h3>
        ${renderContextBreakdown(stats)}
      </div>

      <div class="bg-brand-50/60 rounded-2xl p-4 border border-brand-100">
        <h3 class="text-sm font-semibold text-brand-800 mb-2">خلاصه گزارش</h3>
        <ul class="text-sm text-brand-900/80 space-y-2">
          ${insights.map((line) => `<li class="flex gap-2"><span class="text-brand-400">•</span><span>${line}</span></li>`).join('')}
        </ul>
      </div>

      ${stats.avg7 != null ? `
        <p class="text-xs text-slate-400 text-center">میانگین ۷ اندازه‌گیری اخیر: ${stats.avg7} mg/dL</p>
      ` : ''}
    </div>
  `;
}

export function renderReport() {
  return `
    <div class="page-enter max-w-lg mx-auto px-4 pt-20 pb-28">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">گزارش</h2>
          <p class="text-sm text-slate-500 mt-1">تحلیل آماری سوابق قند خون</p>
        </div>
        <button id="btn-refresh-report"
          class="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>
      <div id="report-content">${renderSkeleton()}</div>
    </div>
  `;
}

async function loadReport() {
  const container = document.getElementById('report-content');
  if (!container) return;

  destroyCharts();
  container.innerHTML = renderSkeleton();

  const userId = getUserId();
  if (!userId) {
    container.innerHTML = '<p class="text-center text-red-500 py-12">لطفاً دوباره وارد شوید</p>';
    return;
  }

  try {
    const records = dedupeRecords(await fetchHistory(userId));
    const stats = computeStats(records);

    if (!stats) {
      container.innerHTML = `
        <div class="text-center py-16">
          <p class="font-semibold text-slate-600">داده‌ای برای گزارش وجود ندارد</p>
          <p class="text-sm text-slate-400 mt-1">اولین اندازه‌گیری را ثبت کنید</p>
        </div>
      `;
      return;
    }

    container.innerHTML = renderReportContent(stats);
    requestAnimationFrame(() => initCharts(stats));
  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-red-500 font-medium mb-3">${err.message || 'خطا در بارگذاری گزارش'}</p>
        <button id="btn-retry-report" class="text-sm text-brand-600 font-semibold">تلاش مجدد</button>
      </div>
    `;
    document.getElementById('btn-retry-report')?.addEventListener('click', loadReport);
  }
}

export function initReport() {
  loadReport();
  document.getElementById('btn-refresh-report')?.addEventListener('click', () => {
    loadReport();
    showToast('در حال بروزرسانی گزارش...', 'info');
  });
}

export function cleanupReport() {
  destroyCharts();
}
