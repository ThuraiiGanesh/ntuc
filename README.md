# 🍜 Googoogaga — Singapore Hawker Food AI Nutrition Tracker

An AI-powered nutrition tracker and personalized hawker meal planner tailored for Singapore's hawker culture. Users can scan hawker dishes with camera/photo recognition, customize portions in grams, track macronutrients, log water and weight, and generate personalized meal plans based on their daily calorie and protein goals.

---

## ✨ Features

- **🇸🇬 Hawker Food Intelligence**: Instant AI-powered breakdown of local dishes (Laksa, Chicken Rice, Nasi Lemak, Roti Prata, Bak Chor Mee, etc.) with estimated portion weights and macro breakdowns.
- **📸 Smart Vision Recognition**: Uses Gemini Vision with localized few-shot reasoning.
- **🧠 Continuous Model Learning**: Food photos, user confirmations, and corrections are saved and automatically injected into prompt context so recognition accuracy compounds over time.
- **🔐 User Authentication**: Secure email and password registration and login with salt + PBKDF2 hashing.
- **📊 Daily Nutrition & Progress Tracking**: Calories, protein, carbs, fats, sodium, water intake, and weight tracking.
- **🎯 Smart Hawker Recommendations & Meal Planner**: Meal plans and healthier hawker swaps customized to remaining daily macros.
- **💾 Persistent Database**: Full SQLite persistence (`hawker.db`) storing users, profiles, logs, and training samples.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js v20+ or v22+
- NPM

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```
Add your Google Gemini API key (obtainable free from [Google AI Studio](https://aistudio.google.com/)).

### 3. Start Development Server
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

---

## ☁️ Deploying to Vercel

### Option 1: Deploy Frontend on Vercel (Recommended)
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/new), import your `ntuc` repository.
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client` (or leave root as `.` since `vercel.json` is included)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: URL of your hosted backend API (e.g. deployed on Railway, Render, Fly.io, or VPS).

---

## 📱 Android App (Android Studio)

The app is fully configured for native Android using Capacitor.

### Opening in Android Studio
You can launch the Android Studio project with one command:
```bash
npm run android:open
```
*Or manually open the `client/android` folder in Android Studio via `File -> Open`.*

### Building and Running
1. **Sync Latest Web Changes to Android**:
   ```bash
   npm run android:sync
   ```
2. **Build Debug APK Directly**:
   ```bash
   npm run android:build
   ```
   The compiled APK will be located at:
   `client/android/app/build/outputs/apk/debug/app-debug.apk`

3. **In Android Studio**:
   - Select your connected Android device or an Android Emulator (AVD) in the top device dropdown.
   - Click the green **Run (▶)** button or press `Shift + F10`.

### Backend API Configuration on Android
- **Android Emulator**: Automatically routes to your computer's local backend at `http://10.0.2.2:5000/api`.
- **Physical Phone / Deployed Server**: Open the app, tap **Settings (⚙️)**, scroll to **Backend Server API**, and enter your computer's WiFi IP (e.g. `http://192.168.1.100:5000/api`) or your cloud-deployed backend URL (e.g. `https://your-api.com/api`).

---

## 🛡️ Default Demo Account
- **Email**: `demo@hawker.sg`
- **Password**: `hawker123`
*(Or click "Create Account" on the login screen to register any new account)*

