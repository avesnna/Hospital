const Router = require('express');
const router = new Router();
const departmentController = require('../controllers/departmentController');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')

router.post('/create', checkRoleMiddleware(['admin']), departmentController.create);
router.get('/all', departmentController.getAll);
router.get('/:id', departmentController.getByID);

module.exports = router;

