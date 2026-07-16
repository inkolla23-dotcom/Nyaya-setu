import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { upgradeDatabase } from './config/db_upgrade.js';

dotenv.config();
await upgradeDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['*'];

// Enable CORS for frontend — use FRONTEND_URL in production (set in Render env vars)
app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Incoming Request Logger
app.use((req, res, next) => {
  console.log(`[ROUTE MATCHED] Incoming Request: ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '••••••••';
    console.log(`[REQUEST PAYLOAD]`, safeBody);
  }
  
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[RESPONSE SENT] Matched Route: ${req.method} ${req.url} | Status: ${res.statusCode}`);
    return originalSend.apply(this, arguments);
  };
  next();
});

// Main API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong on the server!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nyaya Setu backend server is running on http://localhost:${PORT}`);
});
