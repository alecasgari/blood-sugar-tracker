# راهنمای ورکفلوهای n8n — Blood Sugar Tracker

## پیش‌نیازها

1. یک نمونه **n8n** (Cloud یا Self-hosted)
2. یک **Google Sheet** با دو تب (Sheet)
3. اکانت Google متصل به n8n (Credential نوع Google Sheets)

---

## ساخت Google Sheet

یک Spreadsheet جدید بسازید و دو Sheet با این نام‌ها و ستون‌ها ایجاد کنید:

### تب `Users`

| userId | email | passwordHash | createdAt |
|--------|-------|--------------|-----------|
| (خالی بگذارید — n8n پر می‌کند) | | | |

### تب `Records`

| recordId | userId | Date | Time | BloodSugar | MealContext | Source | Notes | createdAt |
|----------|--------|------|------|------------|-------------|--------|-------|-----------|
| (خالی بگذارید) | | | | | | |

**ID شیت** را از URL کپی کنید:
`https://docs.google.com/spreadsheets/d/این-قسمت-ID-است/edit`

---

## ایمپورت ورکفلوها در n8n

1. در n8n بروید به **Workflows → Import from File**
2. هر فایل JSON داخل پوشه `workflows/` را جداگانه ایمپورت کنید:
   - `bst-register.json`
   - `bst-login.json`
   - `bst-upload-blood-sugar.json`
   - `bst-save-record.json`
   - `bst-change-password.json`
   - `bst-history.json`
3. در **هر ورکفلو**، نودهای **Google Sheets** را باز کنید و:
   - Credential گوگل خود را وصل کنید
   - **Document ID** را با ID شیت خود جایگزین کنید
4. هر ورکفلو را **Activate** (فعال) کنید
5. URL واقعی Webhook را از نود Webhook کپی کنید و در `js/api.js` قرار دهید

---

## آدرس Webhook (پس از فعال‌سازی)

| ورکفلو | Path پیش‌فرض | متغیر در api.js |
|--------|--------------|-----------------|
| Register | `/webhook/register` | `WEBHOOK_REGISTER` |
| Login | `/webhook/login` | `WEBHOOK_LOGIN` |
| Upload (آنالیز عکس) | `/webhook/upload-blood-sugar` | `WEBHOOK_UPLOAD` |
| Save Record (ثبت نهایی) | `/webhook/save-record` | `WEBHOOK_SAVE_RECORD` |
| History | `/webhook/history` | `WEBHOOK_HISTORY` |
| Change Password | `/webhook/change-password` | `WEBHOOK_CHANGE_PASSWORD` |

مثال:
`https://your-n8n.app.n8n.cloud/webhook/login`

---

## قرارداد API (Frontend ↔ n8n)

### ثبت‌نام — POST JSON
```json
{ "email": "user@example.com", "password": "secret123" }
```
**پاسخ موفق (200):**
```json
{ "success": true, "userId": "uuid", "email": "user@example.com" }
```
**پاسخ خطا (401):**
```json
{ "success": false, "message": "این ایمیل قبلاً ثبت شده است" }
```

### ورود — POST JSON
```json
{ "email": "user@example.com", "password": "secret123" }
```
**پاسخ موفق (200):**
```json
{ "success": true, "userId": "uuid", "email": "user@example.com" }
```

### تغییر رمز — POST JSON
```json
{
  "userId": "uuid",
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```
**پاسخ موفق (200):**
```json
{ "success": true, "message": "رمز عبور با موفقیت تغییر کرد" }
```
**پاسخ خطا (401):**
```json
{ "success": false, "message": "رمز عبور فعلی اشتباه است" }
```

### آنالیز عکس — POST multipart/form-data
- `userId` — متن
- `image` — فایل تصویر
- `analyzeOnly` — `true` (فقط OCR، بدون ذخیره)

**پاسخ موفق (200):**
```json
{ "success": true, "bloodSugar": 112, "notes": "...", "message": "آنالیز انجام شد" }
```

### ثبت نهایی — POST JSON
```json
{
  "userId": "uuid",
  "bloodSugar": 112,
  "mealContext": "2h_after",
  "source": "ocr",
  "notes": "..."
}
```

مقادیر `mealContext`: `fasting`, `before_meal`, `1h_after`, `2h_after`, `3h_after`, `4h_plus`, `before_sleep`

**پاسخ موفق (200):**
```json
{ "success": true, "bloodSugar": 112, "mealContext": "2h_after", "message": "ثبت شد" }
```

### تاریخچه — POST JSON
```json
{ "userId": "uuid" }
```
**پاسخ موفق (200):** آرایه مستقیم
```json
[
  { "Date": "1404/03/15", "Time": "08:30", "BloodSugar": 95, "MealContext": "fasting", "Source": "manual", "Notes": "ثبت دستی" }
]
```

---

### زمان‌بندی (Timezone)

تنظیم timezone در n8n UI روی Code node اثر **ندارد**. سرور n8n معمولاً UTC است.

در نود **Build Record** باید صریحاً `timeZone: 'Asia/Dubai'` در `toLocaleDateString` / `toLocaleTimeString` باشد (در JSON ورکفلوها inline شده).

مرجع: `n8n/helpers/sandbox-utils.js` → `formatAppDateTime()`

---

## CORS (مهم برای GitHub Pages)

هر Webhook در این ورکفلوها `Allowed Origins: *` دارد. اگر از دامنه خاصی سرو می‌کنید، در نود Webhook مقدار را به دامنه GitHub Pages خود تغییر دهید، مثلاً:
`https://username.github.io`

---

## OCR (Gemini)

ورکفلو آپلود **فقط آنالیز** می‌کند و در Sheet ذخیره **نمی‌کند**. ثبت نهایی از webhook `save-record` انجام می‌شود.

### رفع ثبت دوباره (Duplicate)

اگر هر اندازه‌گیری **دو بار** در Sheet ظاهر می‌شود (یکی بدون `MealContext` و یکی با آن):

1. ورکفلو **BST - Upload Blood Sugar** را در n8n باز کنید
2. مطمئن شوید نود **Google Sheets / Save Record** وجود **ندارد**
3. بعد از «OCR Error?» فقط باید به **Respond Analyze Success** وصل باشد (نه Sheets)
4. ورکفلو قدیمی/تکراری با همان path را **Deactivate** کنید
5. فایل `bst-upload-blood-sugar.json` را دوباره import کنید یا دستی اصلاح کنید

راهنمای Gemini: `GEMINI-OCR-SETUP.md`

---

## n8n 2.x — محدودیت Sandbox

در n8n نسخه ۲.۲۲+، `require('crypto')` در نود **Code** مجاز نیست. ورکفلوها از توابع خالص JS برای `SHA-256` و `UUID` استفاده می‌کنند (بدون import ماژول Node).

اگر فقط یک نود را دستی اصلاح می‌کنید، کد مرجع در `n8n/helpers/sandbox-utils.js` است.

---

## امنیت (پیشنهاد Production)

- رمز عبور با SHA-256 هش می‌شود (در Code node). برای Production از **bcrypt** یا سرویس Auth اختصاصی استفاده کنید
- Webhook URLها را محرمانه نگه دارید
- `Allowed Origins` را محدود کنید
- Rate limiting در n8n یا reverse proxy فعال کنید
