import express from 'express';
import { checkAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Kiểm tra xem token hiện tại có hợp lệ không
router.get('/verify', checkAuth, (req, res) => {
  res.json({ 
    isAuthenticated: true, 
    user: req.user 
  });
});

export default router;
