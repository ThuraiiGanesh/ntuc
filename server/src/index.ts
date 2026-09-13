import { app } from './app.js';

const PORT = process.env.PORT || 5000;

// Start server for local development or Docker/Android backend
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Googoogaga Hawker Nutrition Server running on port ${PORT} (0.0.0.0)`);
  console.log(`📍 Local health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 LAN phone access: http://10.6.12.150:${PORT}/api/health`);
  console.log(`🍲 Hawker dishes catalog loaded with 80+ authentic items.`);
});
