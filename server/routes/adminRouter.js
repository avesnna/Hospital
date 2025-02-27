const Router = require('express');
const router = new Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', adminController.login);
router.get('/auth', authMiddleware, adminController.check);
router.post('/logout', adminController.logout);
router.put('/:id', adminController.updatep)
router.put('/s/:id', adminController.updatesp)
router.delete('/p/:id', adminController.deletepatient);
router.delete('/s/:id', adminController.deletespec);
router.post('/s/create', adminController.createspec)
module.exports = router;

