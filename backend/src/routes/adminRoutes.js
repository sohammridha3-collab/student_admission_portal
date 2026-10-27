const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// User Management (CRUD)
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.patch('/users/:id/permissions', adminController.updatePermissions);

// Policy & System Settings
router.get('/policy', adminController.getSystemPolicy);
router.put('/policy', adminController.updateSystemPolicy);

// Audit Trail & Logs
router.get('/audit-logs', adminController.getAuditLogs);

// System Reports & Analytics
router.get('/reports', adminController.getSystemReports);

module.exports = router;
