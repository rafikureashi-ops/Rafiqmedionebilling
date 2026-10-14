# MediOne Pharmacy POS & Billing System 🏥💊

Modern Pharmacy Counter, Inventory, Expiry Tracking & Android Mobile Application.

---

## 🇵🇰 گٹ ہب سے APK ڈاؤن لوڈ کرنے کا طریقہ (Urdu Guide)

اگر آپ اس پروجیکٹ کو GitHub پر اپلوڈ کر کے وہاں سے **Android APK** ڈاؤن لوڈ کرنا چاہتے ہیں، تو یہ آسان طریقہ اپنائیں:

### 1️⃣ مرحلہ 1: پروجیکٹ کو GitHub پر پش کریں
اپنے کمپیوٹر یا ٹرمینل میں یہ کمانڈز چلائیں:
```bash
git init
git add .
git commit -m "MediOne Pharmacy - Complete App & Android APK Workflow"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
*(یا اگر آپ GitHub کی ویب سائٹ استعمال کر رہے ہیں تو "Upload files" کے ذریعے فائلیں اپلوڈ کر دیں)*

### 2️⃣ مرحلہ 2: GitHub Actions پر جائیں
1. اپنے GitHub ریپوزیٹری کے اوپر موجود **"Actions"** ٹیب پر کلک کریں۔
2. بائیں جانب **"Build & Release Android APK"** پر کلک کریں۔
3. آپ دیکھیں گے کہ GitHub خود بخود آپ کی **`medione-pharmacy-debug.apk`** فائل تیار کر رہا ہوگا۔
4. اگر آپ خود دستی طور پر رن کرنا چاہتے ہیں، تو دائیں جانب **"Run workflow"** کے بٹن پر کلک کریں۔

### 3️⃣ مرحلہ 3: APK ڈاؤن لوڈ کریں
1. مکمل شدہ گرین ٹِک (Green Checkmark ✅) والے ورک فلو پر کلک کریں۔
2. صفحے کے نیچے **"Artifacts"** سیکشن میں جائیں۔
3. **`medione-pharmacy-debug-apk`** پر کلک کریں — آپ کی APK فائل فوراً ڈاؤن لوڈ ہو جائے گی!
4. یا بائیں جانب **"Releases"** میں جا کر ڈائریکٹ `.apk` فائل ڈاؤن لوڈ کر لیں۔

### 4️⃣ مرحلہ 4: موبائل میں انسٹال کریں
1. فون میں فائل اوپن کریں۔
2. اگر سیکیورٹی پرامپٹ آئے تو "Allow from this source" کو آن کریں۔
3. **Install** دبائیں اور ایپ استعمال کریں۔

---

## 🇬🇧 English Guide: Automated Android APK Build via GitHub Actions

This repository includes a pre-configured **GitHub Actions Workflow** (`.github/workflows/build-apk.yml`) that automatically compiles an installable Android APK (`medione-pharmacy-debug.apk`) whenever you push code or trigger it manually!

### 🚀 How to Build & Download APK from GitHub:

#### Step 1: Push to your GitHub Repository
```bash
git init
git add .
git commit -m "MediOne Pharmacy POS App"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

#### Step 2: Open GitHub Actions
1. Open your repository on GitHub.
2. Click on the **Actions** tab at the top.
3. Select **"Build & Release Android APK"** from the left sidebar.
4. The workflow runs automatically on every push, or you can trigger it anytime by clicking **"Run workflow"** ➔ **"Run workflow"** button.

#### Step 3: Download the Generated APK
1. Click on the completed workflow run (marked with a green checkmark ✅).
2. Scroll down to the **Artifacts** section at the bottom of the summary page.
3. Click on **`medione-pharmacy-debug-apk`** to download your Android APK.
4. Alternatively, check the **Releases** section on the right side of the repo to download `medione-pharmacy-debug.apk` directly.

---

## 💻 Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build production web bundle
npm run build
```

---

## 📱 Features Included
- 🛒 Fast POS Counter Billing with Barcode & QR Scanner
- 💊 Medicine Inventory & Batch-wise Expiry Tracking
- 🧾 Thermal Receipt & Detailed A4 Invoice Generation
- 🎨 Pharmacy Logo & Splash Screen Customizer
- 📊 Profit/Loss, Sales Analytics & Tax Calculations
- 📲 Native Android APK with Offline SQLite / LocalStorage
