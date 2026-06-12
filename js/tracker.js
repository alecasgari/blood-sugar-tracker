import { getUserId, uploadBloodSugar } from './api.js';
import { showToast } from './toast.js';
import { getBloodSugarStatus } from './bloodSugar.js';

function renderResultCard(bloodSugar, notes = '') {
  const status = getBloodSugarStatus(bloodSugar);

  return `
    <div id="result-card" class="result-reveal mt-6 rounded-2xl border-2 ${status.border} ${status.bg} p-6 shadow-lg ring-4 ${status.ring} ring-opacity-30">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            <svg class="w-5 h-5 ${status.text}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold ${status.text}">نتیجه آنالیز</p>
            <p class="text-xs text-slate-500">با موفقیت ثبت شد</p>
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
        <p class="mt-4 text-sm text-slate-600 bg-white/60 rounded-xl px-4 py-3 border border-white/80 text-center">
          ${notes}
        </p>
      ` : ''}

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
        <p class="text-sm text-slate-500 mt-1">عکس صفحه نمایش گلوکومتر را بارگذاری کنید</p>
      </div>

      <div id="tracker-form">
        <!-- Upload Area -->
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
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                گالری
              </button>
              <button id="btn-pick-camera" type="button"
                class="btn-press flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 transition-all">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.125 13.125L12 17.25l-4.125-4.125M12 17.25V6.75" />
                </svg>
                دوربین
              </button>
            </div>
          </div>

          <div id="preview-container" class="hidden">
            <div class="relative inline-block">
              <img id="preview-image" src="" alt="پیش‌نمایش عکس قند خون"
                class="preview-image max-h-56 rounded-xl object-contain mx-auto shadow-md" />
              <button id="btn-remove-image" type="button"
                class="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors z-20">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="flex gap-3 mt-4 justify-center max-w-xs mx-auto">
              <button id="btn-change-gallery" type="button"
                class="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors px-3 py-1">
                گالری
              </button>
              <span class="text-slate-300">|</span>
              <button id="btn-change-camera" type="button"
                class="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors px-3 py-1">
                دوربین
              </button>
            </div>
          </div>
        </div>

        <input id="gallery-input" type="file" accept="image/*" class="hidden" />
        <input id="camera-input" type="file" accept="image/*" capture="environment" class="hidden" />

        <button id="btn-submit" type="button" disabled
          class="btn-press mt-6 w-full py-4 rounded-xl bg-gradient-to-l from-brand-600 to-brand-500 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          <span>ارسال و آنالیز</span>
        </button>
      </div>

      <div id="result-slot"></div>

      <div id="tracker-tips" class="mt-8 bg-brand-50/60 rounded-2xl p-4 border border-brand-100">
        <h3 class="text-sm font-semibold text-brand-800 mb-2 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.05 12.05 0 003.478-.397M12 6.75V4.5" />
          </svg>
          نکات عکس‌برداری
        </h3>
        <ul class="text-xs text-brand-700/80 space-y-1.5 list-disc list-inside">
          <li>صفحه نمایش گلوکومتر را واضح و بدون تاری عکس بگیرید</li>
          <li>از نور کافی و زاویه مستقیم استفاده کنید</li>
          <li>سایه و بازتاب نور را به حداقل برسانید</li>
        </ul>
      </div>
    </div>
  `;
}

export function initTracker() {
  let selectedFile = null;

  const trackerForm = document.getElementById('tracker-form');
  const resultSlot = document.getElementById('result-slot');
  const trackerTips = document.getElementById('tracker-tips');
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
  const btnSubmit = document.getElementById('btn-submit');

  function openFilePicker(input) {
    input.value = '';
    input.click();
  }

  function hideResult() {
    resultSlot.innerHTML = '';
    trackerForm.classList.remove('hidden');
    trackerTips.classList.remove('hidden');
  }

  function showResult(bloodSugar, notes) {
    trackerForm.classList.add('hidden');
    trackerTips.classList.add('hidden');
    resultSlot.innerHTML = renderResultCard(bloodSugar, notes);
    document.getElementById('btn-new-reading')?.addEventListener('click', () => {
      hideResult();
      resetForm();
    });
    resultSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetForm() {
    selectedFile = null;
    galleryInput.value = '';
    cameraInput.value = '';
    previewImage.src = '';
    uploadPlaceholder.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    uploadZone.classList.remove('has-image');
    btnSubmit.disabled = true;
  }

  function showPreview(file) {
    hideResult();

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
      btnSubmit.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  galleryInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
  });

  cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
  });

  btnPickGallery.addEventListener('click', () => openFilePicker(galleryInput));
  btnPickCamera.addEventListener('click', () => openFilePicker(cameraInput));
  btnChangeGallery.addEventListener('click', () => openFilePicker(galleryInput));
  btnChangeCamera.addEventListener('click', () => openFilePicker(cameraInput));

  btnRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    hideResult();
    resetForm();
  });

  btnSubmit.addEventListener('click', async () => {
    if (!selectedFile) return;

    const userId = getUserId();
    if (!userId) {
      showToast('لطفاً دوباره وارد شوید', 'error');
      return;
    }

    const originalHtml = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<div class="spinner"></div><span>در حال آنالیز...</span>';

    try {
      const data = await uploadBloodSugar(userId, selectedFile);
      const bloodSugar = data?.bloodSugar ?? data?.BloodSugar;
      const notes = data?.notes || data?.Notes || '';

      if (bloodSugar == null || bloodSugar === '') {
        showToast(data?.message || 'ثبت شد اما عدد قند برگشت داده نشد', 'info');
        resetForm();
        return;
      }

      showResult(bloodSugar, notes);
      showToast('آنالیز با موفقیت انجام شد', 'success');
    } catch (err) {
      showToast(err.message || 'خطا در ارسال عکس', 'error');
    } finally {
      btnSubmit.innerHTML = originalHtml;
      btnSubmit.disabled = !selectedFile;
    }
  });
}
