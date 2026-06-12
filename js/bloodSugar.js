const LOW_THRESHOLD = 70;
const HIGH_THRESHOLD = 140;

export function getBloodSugarStatus(value) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { label: 'نامشخص', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-200' };
  }
  if (num < LOW_THRESHOLD) {
    return { label: 'پایین', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-200' };
  }
  if (num > HIGH_THRESHOLD) {
    return { label: 'بالا', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-200' };
  }
  return { label: 'نرمال', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-200' };
}
