export const HONEYPOT_FIELD = 'website';

export function renderHoneypotField() {
  return `
    <div class="hp-field" aria-hidden="true">
      <label for="hp-${HONEYPOT_FIELD}">Website</label>
      <input id="hp-${HONEYPOT_FIELD}" name="${HONEYPOT_FIELD}" type="text" tabindex="-1" autocomplete="off" value="" />
    </div>
  `;
}

export function readHoneypot(scope) {
  const root = scope instanceof HTMLElement
    ? scope
    : (typeof scope === 'string' ? document.getElementById(scope) : document);

  const input = root?.querySelector?.(`input[name="${HONEYPOT_FIELD}"]`)
    || document.querySelector(`input[name="${HONEYPOT_FIELD}"]`);

  return (input?.value || '').trim();
}

export function isHoneypotTriggered(value) {
  return Boolean(value);
}

/** Block bot submissions without revealing the honeypot. */
export function blockIfHoneypot(value) {
  if (isHoneypotTriggered(value)) {
    return true;
  }
  return false;
}
