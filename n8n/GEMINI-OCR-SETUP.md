# Google Gemini — Analyze Image (روش پیشنهادی)

## علت خطای «تصویری برای تحلیل یافت نشد»

نود **Google Gemini → Analyze an image** به‌صورت پیش‌فرض **Input Type = URL** است.
Webhook شما تصویر را به‌صورت **Binary** با نام `image` می‌فرستد — بدون تنظیم Binary، Gemini فقط متن پرامپت را می‌بیند و می‌گوید عکسی نیست.

---

## معماری صحیح

```
Webhook Upload
    ↓
Validate Input          ← userId + binary.image را نگه می‌دارد
    ↓
Validation Error?
    ↓ (خیر)
Analyze an image        ← Input Type: Binary, field: image
    ↓
Parse Gemini JSON       ← content.parts[0].text → JSON
    ↓
Build Record
    ↓
OCR Error? → Save Record → Respond Success
```

---

## تنظیمات نود Analyze an image

| فیلد | مقدار |
|------|--------|
| **Resource** | Image |
| **Operation** | Analyze |
| **Model** | `models/gemini-flash-latest` |
| **Input Type** | **Binary** ← مهم‌ترین تنظیم |
| **Binary Property Name** | `image` |
| **Simplify Output** | خاموش (false) |

### Prompt — کپی کنید

```
You are a medical image OCR specialist for glucometer displays.

Analyze the attached image and extract the main blood glucose reading.

Rules:
- Read ONLY the primary glucose number on the device screen.
- Ignore date, time, battery, arrows, and menus unless useful for notes.
- bloodSugar: number or null if unreadable.
- unit: exactly "mg/dL" or "mmol/L" (default "mg/dL").
- confidence: "high" | "medium" | "low".
- notes: short Persian text (max 120 chars).

Return ONLY this JSON object, no markdown, no extra text:
{"bloodSugar":112,"unit":"mg/dL","confidence":"high","notes":"عدد واضح روی صفحه نمایش"}
```

---

## نود Parse Gemini JSON (Code)

بعد از Analyze، خروجی ممکن است یکی از این دو شکل باشد:

```json
{
  "candidates": [{
    "content": {
      "parts": [{ "text": "{\"bloodSugar\":112,...}" }]
    }
  }]
}
```

یا (نسخه‌های قدیمی‌تر):

```json
{
  "content": {
    "parts": [{ "text": "{\"bloodSugar\":112,...}" }]
  }
}
```

کد Parse در ورکفلو `bst-upload-blood-sugar.json` این را به JSON تمیز تبدیل می‌کند.

---

## چک‌لیست قبل از تست

1. ورودی **Validation Error?** به Analyze وصل است (نه مستقیم Webhook → Analyze بدون binary)
2. در Validate Input تب **Binary** خروجی، فیلد `image` وجود دارد
3. Analyze an image → **Input Type = Binary** و **Binary Property Name = image**
4. Credential Gemini درست است

---

## تست سریع در n8n

1. روی **Webhook Upload** → **Listen for test event**
2. از اپ یا curl عکس بفرستید
3. در خروجی **Validate Input** → تب Binary باید `image` ببینید
4. در خروجی **Analyze an image** → `bloodSugar` عدد واقعی باشد (نه null)

```bash
curl -X POST https://n8n.alecasgari.com/webhook/upload-blood-sugar \
  -F "userId=YOUR_USER_ID" \
  -F "image=@glucometer.jpg"
```
