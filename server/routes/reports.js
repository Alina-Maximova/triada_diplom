// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');



router.post('/', authMiddleware, reportController.createReport);
router.get('/', authMiddleware, reportController.getReports);
router.get('/task/:task_id', authMiddleware, reportController.getReportByTaskId);
router.get('/:id', authMiddleware, reportController.getReportById);
router.put('/:id', authMiddleware, reportController.updateReport);
router.delete('/:id', authMiddleware, reportController.deleteReport);
router.get('/:id/download', authMiddleware, reportController.downloadReportArchive);


module.exports = router;