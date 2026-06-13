import { getUserId, analyzeBloodSugar, saveRecord } from './api.js';
import { showToast } from './toast.js';
import { getBloodSugarStatus } from './bloodSugar.js';
import { getMealContext, renderMealContextOptions } from './mealContext.js';
import { renderHoneypotField, readHoneypot, blockIfHoneypot } from './honeypot.js';

function renderConfirmCard(bloodSugar, notes, source) {
  const status = getBloodSugarStatus(bloodSugar);

  return `
    <div id="confirm-card" class="result-reveal mt-6 rounded-2xl border-2 ${status.border} ${status.bg} p-6 shadow-lg ring-4 ${status.ring} ring-opacity-30">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            <svg class="w-5 h-5 ${status.text}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold ${status.text}">${source === 'ocr' ? 'نتیجه آنالیز' : 'مقدار وارد شده'}</p>
            <p class="text-xs text-slate-500">زمان‌بندی وعده را انتخاب کنید</p>
          </div>
        </div>
        <span class="text-xs font-bold px-3 py-1.5 rounded-full bg-white/80 ${status.text} border ${status.border}">
          ${status.label}
        </span>
      </div>

      <div class="text-center py-2">
        <div class="result-value-pop flex items-end justify-center gap-2">
          <span class="text-6xl font-bold ${status.text} tracking-tight">${bloodSugar}</span>
          <span class="text-lg text-slate-500 mb-2">mg/dL</span>
        </div>
      </div>

      ${notes ? `
        <p class="mt-3 text-sm text-slate-600 bg-white/60 rounded-xl px-4 py-3 border border-white/80 text-center">${notes}</p>
      ` : ''}

      <div class="mt-5">
        <p class="text-sm font-semibold text-slate-700 mb-3">از آخرین وعده غذایی چقدر می‌گذرد؟</p>
        <div id="meal-context-list" class="space-y-2 max-h-64 overflow-y-auto pr-1">
          ${renderMealContextOptions()}
        </div>
        <p id="meal-context-hint" class="mt-3 text-xs text-slate-500 hidden"></p>
      </div>

      <button id="btn-save-record" type="button" disabled
        class="btn-press mt-5 w-full py-3.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        ثبت نهایی
      </button>

      <button id="btn-cancel-confirm" type="button"
        class="btn-press mt-2 w-full py-2.5 rounded-xl text-slate-500 font-medium text-sm hover:text-slate-700 transition-colors">
        انصراف
      </button>
    </div>
  `;
}

function renderSavedCard(bloodSugar, mealContextId, notes) {
  const status = getBloodSugarStatus(bloodSugar, mealContextId);
  const ctx = getMealContext(mealContextId);

  return `
    <div id="saved-card" class="result-reveal mt-6 rounded-2xl border-2 ${status.border} ${status.bg} p-6 shadow-lg ring-4 ${status.ring} ring-opacity-30">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm font-semibold ${status.text}">ثبت شد</p>
          <p class="text-xs text-slate-500">${ctx?.label || ''}</p>
        </div>
        <span class="text-xs font-bold px-3 py-1.5 rounded-full bg-white/80 ${status.text} border ${status.border}">${status.label}</span>
      </div>

      <div class="text-center py-2">
        <div class="flex items-end justify-center gap-2">
          <span class="text-5xl font-bold ${status.text}">${bloodSugar}</span>
          <span class="text-lg text-slate-500 mb-1">mg/dL</span>
        </div>
      </div>

      ${ctx?.evaluation ? `
        <p class="mt-4 text-sm text-slate-600 bg-white/60 rounded-xl px-4 py-3 border border-white/80">${ctx.evaluation}</p>
      ` : ''}

      ${notes ? `<p class="mt-2 text-xs text-slate-500 text-center">${notes}</p>` : ''}

      <button id="btn-new-reading" type="button"
        class="btn-press mt-5 w-full py-3 rounded-xl bg-white border ${status.border} ${status.text} font-semibold text-sm hover:bg-white/90 transition-all shadow-sm">
        ثبت اندازه‌گیری جدید
      </button>
    </div>
  `;
}

export function renderTracker() {
  return `
    <div class="page-enter max-w-lg mx-auto px-4 pt-20 pb-28">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-slate-800">ثبت قند خون</h2>
        <p class="text-sm text-slate-500 mt-1">عکس بگیرید یا عدد را دستی وارد کنید</p>
      </div>

      <div class="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5">
        <button id="tab-photo" type="button" data-mode="photo"
          class="tracker-tab flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all bg-white text-brand-700 shadow-sm">
          عکس / دوربین
        </button>
        <button id="tab-manual" type="button" data-mode="manual"
          class="tracker-tab flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500">
          ثبت دستی
        </button>
      </div>

      <div id="tracker-form" class="relative">
        ${renderHoneypotField()}
        <!-- Photo mode -->
        <div id="mode-photo">
          <div id="upload-zone"
            class="upload-zone rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
            <div id="upload-placeholder" class="py-4">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.125 13.125L12 17.25l-4.125-4.125M12 17.25V6.75" />
                </svg>
              </div>
              <p class="font-semibold text-slate-700">عکس گلوکومتر را اضافه کنید</p>
              <p class="text-xs text-slate-400 mt-1.5">از دوربین بگیرید یا از گالری انتخاب کنید</p>
              <div class="flex gap-3 mt-6 max-w-xs mx-auto">
                <button id="btn-pick-gallery" type="button"
                  class="btn-press flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-50 text-brand-700 font-semibold text-sm border border-brand-100 hover:bg-brand-100 transition-all">
                  گالری
                </button>
                <button id="btn-pick-camera" type="button"
                  class="btn-press flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/25">
                  دوربین
                </button>
              </div>
            </div>
            <div id="preview-container" class="hidden">
              <div class="relative inline-block">
                <img id="preview-image" src="" alt="پیش‌نمایش" class="preview-image max-h-56 rounded-xl object-contain mx-auto shadow-md" />
                <button id="btn-remove-image" type="button"
                  class="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center z-20">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="flex gap-3 mt-4 justify-center">
                <button id="btn-change-gallery" type="button" class="text-sm text-brand-600 font-medium px-3 py-1">گالری</button>
                <span class="text-slate-300">|</span>
                <button id="btn-change-camera" type="button" class="text-sm text-brand-600 font-medium px-3 py-1">دوربین</button>
              </div>
            </div>
          </div>
          <input id="gallery-input" type="file" accept="image/*" class="hidden" />
          <input id="camera-input" type="file" accept="image/*" capture="environment" class="hidden" />
          <button id="btn-submit-photo" type="button" disabled
            class="btn-press mt-6 w-full py-4 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            ارسال و آنالیز
          </button>
        </div>

        <!-- Manual mode -->
        <div id="mode-manual" class="hidden">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <label for="manual-value" class="block text-sm font-semibold text-slate-700 mb-2">مقدار قند خون (mg/dL)</label>
            <input id="manual-value" type="number" inputmode="decimal" min="20" max="600" step="1"
              placeholder="مثلاً ۱۱۲"
              class="w-full text-center text-3xl font-bold text-slate-800 py-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all" />
            <p class="text-xs text-slate-400 mt-2 text-center">عدد نمایش‌داده‌شده روی گلوکومتر را وارد کنید</p>
          </div>
          <button id="btn-submit-manual" type="button" disabled
            class="btn-press mt-6 w-full py-4 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            ادامه
          </button>
        </div>
      </div>

      <div id="result-slot"></div>

      <div id="tracker-tips" class="mt-8 bg-brand-50/60 rounded-2xl p-4 border border-brand-100">
        <h3 class="text-sm font-semibold text-brand-800 mb-2">نکات</h3>
        <ul class="text-xs text-brand-700/80 space-y-1.5 list-disc list-inside">
          <li>برای آنالیز عکس، صفحه نمایش را واضح و بدون تاری بگیرید</li>
          <li>بعد از ثبت، زمان‌بندی نسبت به آخرین وعده را مشخص کنید</li>
          <li>ثبت دستی برای زمانی که عکس ندارید مناسب است</li>
        </ul>
      </div>
    </div>
  `;
}

export function initTracker() {
  let selectedFile = null;
  let pendingReading = null;

  const trackerForm = document.getElementById('tracker-form');
  const resultSlot = document.getElementById('result-slot');
  const trackerTips = document.getElementById('tracker-tips');
  const modePhoto = document.getElementById('mode-photo');
  const modeManual = document.getElementById('mode-manual');
  const tabPhoto = document.getElementById('tab-photo');
  const tabManual = document.getElementById('tab-manual');
  const uploadZone = document.getElementById('upload-zone');
  const galleryInput = document.getElementById('gallery-input');
  const cameraInput = document.getElementById('camera-input');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const previewContainer = document.getElementById('preview-container');
  const previewImage = document.getElementById('preview-image');
  const btnRemove = document.getElementById('btn-remove-image');
  const btnPickGallery = document.getElementById('btn-pick-gallery');
  const btnPickCamera = document.getElementById('btn-pick-camera');
  const btnChangeGallery = document.getElementById('btn-change-gallery');
  const btnChangeCamera = document.getElementById('btn-change-camera');
  const btnSubmitPhoto = document.getElementById('btn-submit-photo');
  const manualValue = document.getElementById('manual-value');
  const btnSubmitManual = document.getElementById('btn-submit-manual');

  function setMode(mode) {
    const isPhoto = mode === 'photo';
    modePhoto.classList.toggle('hidden', !isPhoto);
    modeManual.classList.toggle('hidden', isPhoto);
    tabPhoto.classList.toggle('bg-white', isPhoto);
    tabPhoto.classList.toggle('text-brand-700', isPhoto);
    tabPhoto.classList.toggle('shadow-sm', isPhoto);
    tabPhoto.classList.toggle('text-slate-500', !isPhoto);
    tabManual.classList.toggle('bg-white', !isPhoto);
    tabManual.classList.toggle('text-brand-700', !isPhoto);
    tabManual.classList.toggle('shadow-sm', !isPhoto);
    tabManual.classList.toggle('text-slate-500', isPhoto);
  }

  tabPhoto.addEventListener('click', () => setMode('photo'));
  tabManual.addEventListener('click', () => setMode('manual'));

  function openFilePicker(input) {
    input.value = '';
    input.click();
  }

  function hideForm() {
    trackerForm.classList.add('hidden');
    trackerTips.classList.add('hidden');
  }

  function showForm() {
    trackerForm.classList.remove('hidden');
    trackerTips.classList.remove('hidden');
    resultSlot.innerHTML = '';
    pendingReading = null;
  }

  function resetForm() {
    selectedFile = null;
    galleryInput.value = '';
    cameraInput.value = '';
    previewImage.src = '';
    uploadPlaceholder.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    uploadZone.classList.remove('has-image');
    btnSubmitPhoto.disabled = true;
    manualValue.value = '';
    btnSubmitManual.disabled = true;
  }

  function showConfirmStep(reading) {
    pendingReading = reading;
    hideForm();
    resultSlot.innerHTML = renderConfirmCard(reading.bloodSugar, reading.notes, reading.source);

    const btnSave = document.getElementById('btn-save-record');
    const hint = document.getElementById('meal-context-hint');
    let selectedContext = '';
    let isSaving = false;

    document.querySelectorAll('input[name="mealContext"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        selectedContext = radio.value;
        btnSave.disabled = false;
        const ctx = getMealContext(selectedContext);
        if (ctx && hint) {
          hint.textContent = ctx.evaluation;
          hint.classList.remove('hidden');
        }
        const status = getBloodSugarStatus(reading.bloodSugar, selectedContext);
        hint.className = `mt-3 text-xs ${status.text}`;
      });
    });

    document.getElementById('btn-cancel-confirm')?.addEventListener('click', () => {
      showForm();
      resetForm();
    });

    btnSave?.addEventListener('click', async () => {
      if (isSaving || !selectedContext || !pendingReading) return;
      if (blockIfHoneypot(readHoneypot(trackerForm))) return;
      isSaving = true;

      const userId = getUserId();
      if (!userId) {
        isSaving = false;
        showToast('لطفاً دوباره وارد شوید', 'error');
        return;
      }

      const originalHtml = btnSave.innerHTML;
      btnSave.disabled = true;
      btnSave.innerHTML = '<div class="spinner"></div><span>در حال ثبت...</span>';

      try {
        await saveRecord(userId, {
          bloodSugar: pendingReading.bloodSugar,
          mealContext: selectedContext,
          source: pendingReading.source,
          notes: pendingReading.notes,
        }, readHoneypot(trackerForm));

        resultSlot.innerHTML = renderSavedCard(
          pendingReading.bloodSugar,
          selectedContext,
          pendingReading.notes
        );
        pendingReading = null;
        resetForm();
        showToast('با موفقیت ثبت شد', 'success');

        document.getElementById('btn-new-reading')?.addEventListener('click', () => {
          showForm();
        });
      } catch (err) {
        isSaving = false;
        showToast(err.message || 'خطا در ثبت', 'error');
        btnSave.disabled = false;
        btnSave.innerHTML = originalHtml;
      }
    });

    resultSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showPreview(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری انتخاب کنید', 'error');
      return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      uploadPlaceholder.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      uploadZone.classList.add('has-image');
      btnSubmitPhoto.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  galleryInput.addEventListener('change', (e) => { if (e.target.files[0]) showPreview(e.target.files[0]); });
  cameraInput.addEventListener('change', (e) => { if (e.target.files[0]) showPreview(e.target.files[0]); });
  btnPickGallery.addEventListener('click', () => openFilePicker(galleryInput));
  btnPickCamera.addEventListener('click', () => openFilePicker(cameraInput));
  btnChangeGallery.addEventListener('click', () => openFilePicker(galleryInput));
  btnChangeCamera.addEventListener('click', () => openFilePicker(cameraInput));
  btnRemove.addEventListener('click', (e) => { e.stopPropagation(); resetForm(); });

  manualValue.addEventListener('input', () => {
    const val = parseFloat(manualValue.value);
    btnSubmitManual.disabled = isNaN(val) || val < 20 || val > 600;
  });

  btnSubmitManual.addEventListener('click', () => {
    if (blockIfHoneypot(readHoneypot(trackerForm))) return;
    const val = Math.round(parseFloat(manualValue.value));
    if (isNaN(val) || val < 20 || val > 600) {
      showToast('مقدار بین ۲۰ تا ۶۰۰ وارد کنید', 'error');
      return;
    }
    showConfirmStep({ bloodSugar: val, notes: 'ثبت دستی', source: 'manual' });
  });

  btnSubmitPhoto.addEventListener('click', async () => {
    if (!selectedFile) return;
    if (blockIfHoneypot(readHoneypot(trackerForm))) return;

    const userId = getUserId();
    if (!userId) {
      showToast('لطفاً دوباره وارد شوید', 'error');
      return;
    }

    const originalHtml = btnSubmitPhoto.innerHTML;
    btnSubmitPhoto.disabled = true;
    btnSubmitPhoto.innerHTML = '<div class="spinner"></div><span>در حال آنالیز...</span>';

    try {
      const data = await analyzeBloodSugar(userId, selectedFile, readHoneypot(trackerForm));
      const bloodSugar = data?.bloodSugar ?? data?.BloodSugar;
      const notes = data?.notes || data?.Notes || '';

      if (bloodSugar == null || bloodSugar === '') {
        showToast(data?.message || 'عدد قند قابل تشخیص نبود', 'error');
        return;
      }

      showConfirmStep({ bloodSugar, notes, source: 'ocr' });
      showToast('آنالیز انجام شد — زمان وعده را انتخاب کنید', 'success');
    } catch (err) {
      showToast(err.message || 'خطا در آنالیز عکس', 'error');
    } finally {
      btnSubmitPhoto.innerHTML = originalHtml;
      btnSubmitPhoto.disabled = !selectedFile;
    }
  });
}
