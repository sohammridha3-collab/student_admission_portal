const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticateToken);
router.use(requireRole('STUDENT'));

router.get('/application', studentController.getApplication);
router.post('/fill-form', studentController.fillForm);
router.post('/upload-document', upload.single('file'), studentController.uploadDocument);
router.delete('/document/:id', studentController.deleteDocument);
router.post('/pay-fee', studentController.payFee);
router.post('/submit-application', studentController.submitApplication);

module.exports = router;
