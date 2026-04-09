const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/task/:taskId', authMiddleware, commentController.getTaskComments);
router.post('/', authMiddleware, commentController.addComment);
router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;