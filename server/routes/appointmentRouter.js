const Router = require('express');
const router = new Router();
const appointmentController = require('../controllers/appointmentController');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')

router.post('/create', checkRoleMiddleware(['patient', 'specialist']), appointmentController.create);
router.get('/all', checkRoleMiddleware(['patient', 'specialist', 'admin']), appointmentController.getAll);
router.get('/:id', checkRoleMiddleware(['patient']), appointmentController.getByID);
router.delete('/:id', checkRoleMiddleware(['patient', 'admin']), appointmentController.delete);

module.exports = router;

