const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, taskController.getTasks);
router.get('/:id', authMiddleware, taskController.getTask);
router.post('/', authMiddleware, taskController.addTask);
router.delete('/:id', authMiddleware, taskController.deleteTask);
router.put('/status/:id', authMiddleware, taskController.updateTaskStatus);
router.put('/:id', authMiddleware, taskController.updateTask);
router.get('/:id/archive', authMiddleware, taskController.downloadTaskArchive);


module.exports = router;