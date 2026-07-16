import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'nyaya_setu_secret_key_12345';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  if (token === 'demo_token_client') {
    req.user = { id: 1, email: 'ramesh@example.com', role: 'client', name: 'Ramesh Kumar' };
    return next();
  }

  if (token === 'demo_token_advocate') {
    req.user = { 
      id: 6, 
      email: 'aditi@example.com', 
      role: 'advocate', 
      name: 'Adv. Aditi Sharma',
      advocateDetails: { id: 1 }
    };
    return next();
  }

  if (token === 'demo_token_verification_officer') {
    req.user = { id: 99, email: 'ndhivija3@gmail.com', role: 'verification_officer', name: 'Officer Dhivija' };
    return next();
  }

  if (token === 'demo_token_super_admin') {
    req.user = { id: 100, email: 'admin@nyayasetu.in', role: 'super_admin', name: 'System Super Admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function authorizeRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Unauthorized role access' });
    }
    next();
  };
}
