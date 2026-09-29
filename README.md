# Aura Weather — Minimalist Live Forecast App

A clean, minimalist weather web application with real-time local conditions, hourly forecasts, 5-day outlook, sun cycle tracking, and zero API key exposure.

---

## 🚀 One-Click Vercel Deployment

Deploying this app to Vercel keeps your API key **100% secret** using Vercel Serverless Functions (`/api/weather`). Your API key is **never** committed to GitHub and **never** exposed to client browsers.

### Steps to Deploy:
1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy weather app"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." > "Project"**.
   - Select your GitHub repository.
3. **Add Environment Variable on Vercel**:
   - In the project setup screen (or under **Settings > Environment Variables**), add:
     - **Key**: `OPENWEATHER_API_KEY`
     - **Value**: `your_actual_openweathermap_key_here`
4. **Click Deploy**:
   - Vercel automatically deploys the frontend and the secure serverless API proxy (`/api/weather`).

---

## 🔒 Security Architecture
- **`.env`**: Ignored by `.gitignore`. Used for local development only.
- **`config.js`**: Tracked in Git, but contains **no secret keys**.
- **`api/weather.js`**: Runs securely on Vercel's backend, reading `process.env.OPENWEATHER_API_KEY` and serving weather JSON to your frontend.
- **Fallback Engine**: If running statically or locally without a backend, the app automatically uses the free, keyless Open-Meteo engine.

---

## 💻 Local Development
Simply open `index.html` in any modern web browser or serve with:
```bash
npx serve .
```
