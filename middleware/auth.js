import jwt from 'jsonwebtoken';
import { models } from '../server/database.js';

const User = models.USER;

// Basic authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔍 Auth middleware called');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('🔍 Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Token decoded successfully, User_ID:', decoded.User_ID);
    
    console.log('🔍 User model available:', !!User);
    const user = await User.findOne({ User_ID: decoded.User_ID }).select('-Password');
    console.log('🔍 User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found for User_ID:', decoded.User_ID);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    console.log('🔍 Auth successful for user:', user.User_ID);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('❌ Error type:', error.name);
    console.error('❌ Error message:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

// Admin only middleware
export const adminMiddleware = async (req, res, next) => {
  try {
    await authMiddleware(req, res, () => {
      if (req.user.User_Role !== 'ATL_ADMIN') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin middleware' });
  }
};

// ATL Member middleware (for creating projects)
export const atlMemberMiddleware = async (req, res, next) => {
  try {
    await authMiddleware(req, res, () => {
      const allowedRoles = [
        'ATL_ADMIN',
        'ATL_Member_HKU_Staff',
        'ATL_Member_HKU_Student',
        'ATL_Member_General'
      ];
      
      if (!allowedRoles.includes(req.user.User_Role)) {
        return res.status(403).json({ message: 'Access denied. ATL membership required.' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error in ATL member middleware' });
  }
};