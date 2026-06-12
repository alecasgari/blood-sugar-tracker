export const MEAL_CONTEXTS = [
  {
    id: 'fasting',
    label: 'ناشتا',
    timeRange: '۸ تا ۱۲ ساعت بدون کالری',
    evaluation: 'مهم‌ترین معیار برای بررسی دیابت و مقاومت به انسولین',
    minNormal: 70,
    maxNormal: 100,
  },
  {
    id: 'before_meal',
    label: 'قبل از غذا',
    timeRange: '۲ تا ۸ ساعت بعد از وعده قبلی',
    evaluation: 'نشان می‌دهد بدن در حالت پایه چه وضعیتی دارد',
    minNormal: 70,
    maxNormal: 110,
  },
  {
    id: '1h_after',
    label: '۱ ساعت بعد از غذا',
    timeRange: 'حدود ۴۵ تا ۷۵ دقیقه',
    evaluation: 'برای بررسی پیک (Peak) قند خون',
    minNormal: 70,
    maxNormal: 180,
  },
  {
    id: '2h_after',
    label: '۲ ساعت بعد از غذا',
    timeRange: 'حدود ۹۰ تا ۱۵۰ دقیقه',
    evaluation: 'استانداردترین زمان ارزیابی پاسخ بدن به غذا',
    minNormal: 70,
    maxNormal: 140,
  },
  {
    id: '3h_after',
    label: '۳ ساعت بعد از غذا',
    timeRange: 'حدود ۱۵۰ تا ۲۱۰ دقیقه',
    evaluation: 'بررسی بازگشت قند به حالت طبیعی',
    minNormal: 70,
    maxNormal: 120,
  },
  {
    id: '4h_plus',
    label: 'بیش از ۴ ساعت بعد از غذا',
    timeRange: 'بیش از ۴ ساعت',
    evaluation: 'معمولاً نزدیک به وضعیت پایه است، اما ناشتا محسوب نمی‌شود',
    minNormal: 70,
    maxNormal: 110,
  },
  {
    id: 'before_sleep',
    label: 'قبل از خواب',
    timeRange: 'هر زمانی قبل از خواب',
    evaluation: 'برای ارزیابی خطر افت یا افزایش قند در شب',
    minNormal: 90,
    maxNormal: 140,
  },
];

export function getMealContext(id) {
  return MEAL_CONTEXTS.find((c) => c.id === id) || null;
}

export function getMealContextLabel(id) {
  return getMealContext(id)?.label || 'نامشخص';
}

export function renderMealContextOptions(selectedId = '') {
  return MEAL_CONTEXTS.map((ctx) => `
    <label class="meal-option block cursor-pointer">
      <input type="radio" name="mealContext" value="${ctx.id}" class="peer sr-only" ${selectedId === ctx.id ? 'checked' : ''} />
      <div class="rounded-xl border-2 border-slate-200 bg-white p-3.5 transition-all peer-checked:border-brand-500 peer-checked:bg-brand-50 peer-checked:ring-2 peer-checked:ring-brand-200 hover:border-slate-300">
        <div class="flex items-start justify-between gap-2">
          <span class="font-semibold text-sm text-slate-800">${ctx.label}</span>
          <span class="shrink-0 w-4 h-4 rounded-full border-2 border-slate-300 peer-checked:border-brand-500 peer-checked:bg-brand-500 meal-option-dot"></span>
        </div>
        <p class="text-xs text-slate-500 mt-1">${ctx.timeRange}</p>
      </div>
    </label>
  `).join('');
}
