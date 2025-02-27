const Router = require('express');
const router = new Router();
const medicalrecordControllerController = require('../controllers/medicalrecordController');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')

router.get('/all', checkRoleMiddleware(['specialist']), medicalrecordControllerController.getAll);
router.get('/my', checkRoleMiddleware(['patient']), medicalrecordControllerController.getForUser);
router.get('/:id', checkRoleMiddleware(['admin']), medicalrecordControllerController.getById);

module.exports = router;

