const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authenticateToken, requireRole, requirePermission } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('OFFICER', 'ADMIN'));

router.get('/applications', officerController.getApplicationQueue);
router.get('/applications/:id', officerController.getApplicationDetail);

router.post(
  '/documents/:docId/verify',
  requirePermission('canVerifyDocs'),
  officerController.verifyDocument
);

router.post(
  '/applications/:id/entrance-test',
  requirePermission('canGradeTest'),
  officerController.recordEntranceTest
);

router.post(
  '/applications/:id/decision',
  requirePermission('canMakeDecision'),
  officerController.makeApplicationDecision
);

router.get(
  '/reports',
  requirePermission('canExportReports'),
  officerController.getOfficerReports
);

module.exports = router;
