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

## 🛡️ Default Demo Account
- **Email**: `demo@hawker.sg`
- **Password**: `hawker123`
*(Or click "Create Account" on the login screen to register any new account)*
