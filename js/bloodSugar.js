import { getMealContext } from './mealContext.js';

const LOW_THRESHOLD = 70;
const HIGH_THRESHOLD = 140;

const STATUS_STYLES = {
  low: { label: 'پایین', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-200' },
  normal: { label: 'نرمال', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-200' },
  high: { label: 'بالا', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-200' },
  unknown: { label: 'نامشخص', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-200' },
};

export function getBloodSugarStatus(value, mealContextId) {
  const num = parseFloat(value);
  if (isNaN(num)) return { ...STATUS_STYLES.unknown };

  const ctx = mealContextId ? getMealContext(mealContextId) : null;
  const minNormal = ctx?.minNormal ?? LOW_THRESHOLD;
  const maxNormal = ctx?.maxNormal ?? HIGH_THRESHOLD;

  if (num < minNormal) return { ...STATUS_STYLES.low, evaluation: ctx?.evaluation };
  if (num > maxNormal) return { ...STATUS_STYLES.high, evaluation: ctx?.evaluation };
  return { ...STATUS_STYLES.normal, evaluation: ctx?.evaluation };
}

export function isInTargetRange(value, mealContextId) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  const ctx = mealContextId ? getMealContext(mealContextId) : null;
  const minNormal = ctx?.minNormal ?? LOW_THRESHOLD;
  const maxNormal = ctx?.maxNormal ?? HIGH_THRESHOLD;
  return num >= minNormal && num <= maxNormal;
}

export function parseBloodSugarValue(record) {
  const raw = record?.BloodSugar ?? record?.bloodSugar ?? record?.value;
  const num = parseFloat(raw);
  return isNaN(num) ? null : num;
}

export function getRecordMealContextId(record) {
  return record?.MealContext || record?.mealContext || record?.meal_context || '';
}
