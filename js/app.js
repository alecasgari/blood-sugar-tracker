import { isLoggedIn } from './api.js';
import { renderAuth, initAuth } from './auth.js';
import { renderTracker, initTracker } from './tracker.js';
import { renderHistory, initHistory } from './history.js';
import { renderProfile, initProfile } from './profile.js';
import { renderReport, initReport, cleanupReport } from './report.js';

const PAGE_TITLES = {
  tracker: 'ثبت قند',
  history: 'تاریخچه',
  report: 'گزارش',
  profile: 'پروفایل',
};

const pages = {
  tracker: { render: renderTracker, init: initTracker },
  history: { render: renderHistory, init: initHistory },
  report: { render: renderReport, init: initReport, cleanup: cleanupReport },
  profile: { render: renderProfile, init: initProfile },
};

let currentPage = 'tracker';

// ─── UI Shell ──────────────────────────────────────────────────────

function setShellVisible(loggedIn) {
  document.getElementById('app-header')?.classList.toggle('hidden', !loggedIn);
  document.getElementById('bottom-nav')?.classList.toggle('hidden', !loggedIn);
  document.getElementById('app-footer')?.classList.toggle('footer-above-nav', loggedIn);
}

function updateNavActive(page) {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  const titleEl = document.getElementById('header-page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || '';
}

// ─── Router ────────────────────────────────────────────────────────

function navigateTo(page) {
  if (!pages[page]) return;

  pages[currentPage]?.cleanup?.();

  currentPage = page;
  const root = document.getElementById('app-root');
  root.innerHTML = pages[page].render();

  if (page === 'profile') {
    pages[page].init(() => bootApp());
  } else {
    pages[page].init();
  }

  updateNavActive(page);
}

function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
}

// ─── Boot ──────────────────────────────────────────────────────────

function bootApp() {
  const root = document.getElementById('app-root');

  if (!isLoggedIn()) {
    setShellVisible(false);
    root.innerHTML = renderAuth();
    initAuth(() => bootApp());
    return;
  }

  setShellVisible(true);
  initNavigation();
  navigateTo(currentPage);
}

document.addEventListener('DOMContentLoaded', bootApp);
