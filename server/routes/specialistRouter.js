const Router = require('express');
const router = new Router();
const specialistController = require('../controllers/specialistController');
const authMiddleware = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')

router.post('/login', specialistController.login);
router.get('/auth', authMiddleware, specialistController.check);
router.post('/logout', specialistController.logout);
router.get('/all', specialistController.getAll);
router.get('/:id', specialistController.getByID);
router.post('/new', checkRoleMiddleware(['admin']), specialistController.create);
router.put('/:id', checkRoleMiddleware(['admin']), specialistController.update);
router.delete('/:id', checkRoleMiddleware(['admin']), specialistController.delete);

module.exports = router;
