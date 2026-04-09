const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/login', authController.login);
router.post('/createUser', authController.createUser);
router.get('/',authMiddleware, authController.getUsers);
router.delete('/:id',authMiddleware, authController.deleteUser);




module.exports = router;
  