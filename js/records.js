import { parseBloodSugarValue, getRecordMealContextId } from './bloodSugar.js';

function recordTimestamp(record) {
  if (record.createdAt) {
    const t = new Date(record.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  return null;
}

function isOrphanRecord(record) {
  const ctx = getRecordMealContextId(record);
  const source = (record.Source || record.source || '').toString().trim();
  return !ctx && !source;
}

/** Hide OCR duplicates: upload saved without context, save-record saved with context. */
export function dedupeRecords(records) {
  if (!Array.isArray(records) || records.length < 2) return records || [];

  const dropIndexes = new Set();

  records.forEach((candidate, i) => {
    if (!isOrphanRecord(candidate)) return;

    const cVal = parseBloodSugarValue(candidate);
    const cTime = recordTimestamp(candidate);
    if (cVal == null) return;

    const hasBetterMatch = records.some((other, j) => {
      if (i === j) return false;
      if (!getRecordMealContextId(other)) return false;
      if (parseBloodSugarValue(other) !== cVal) return false;

      const oTime = recordTimestamp(other);
      if (cTime != null && oTime != null) {
        return Math.abs(cTime - oTime) <= 120000;
      }

      const cDate = candidate.Date || candidate.date || '';
      const cClock = candidate.Time || candidate.time || '';
      const oDate = other.Date || other.date || '';
      const oClock = other.Time || other.time || '';
      return cDate === oDate && cClock === oClock;
    });

    if (hasBetterMatch) dropIndexes.add(i);
  });

  return records.filter((_, i) => !dropIndexes.has(i));
}
