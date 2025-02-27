const Router = require('express');
const router = new Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')

router.post('/registration', patientController.registration);
router.post('/login', patientController.login);
router.get('/auth', authMiddleware, patientController.check);
router.post('/logout', patientController.logout);
router.get('/all', patientController.getAll);
router.get('/:id', checkRoleMiddleware(['admin']), patientController.getByID);
router.put('/:id', checkRoleMiddleware(['admin']), patientController.update);
router.delete('/:id', checkRoleMiddleware(['admin']), patientController.delete);

module.exports = router;

