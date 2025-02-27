const Router = require('express');
const router = new Router();
require('dotenv').config();
const adminRouter = require('./adminRouter');
const departmentRouter = require('./departmentRouter');
const medicalrecordRouter = require('./medicalrecordRouter');
const patientRouter = require('./patientRouter');
const specialistRouter = require('./specialistRouter');
const appointmentRouter = require('./appointmentRouter');
const authMiddleware = require('../middleware/authMiddleware');
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')
const path = require('path');
const nodemailer = require('nodemailer');
const { Patient, PatientEnter } = require('../models/models');

router.get('/appointment/create', (req, res) => {
    console.log('in index js check for authorized user');
    res.sendFile(path.join(__dirname, '../../client/pages/getAuthAppointmentPage/index-g-a.html'));
});
router.get('/patient/s', (req, res) => {
    console.log('in index js check for authorized user');
    res.sendFile(path.join(__dirname, '../../client/pages/myPatientPage/index-mp.html'));
});

router.use('/admin', adminRouter);
router.use('/appointment', authMiddleware, appointmentRouter);
router.use('/department', departmentRouter);
router.use('/medicalrecord', authMiddleware, medicalrecordRouter);
router.use('/patient', patientRouter);
router.use('/specialist', specialistRouter);

router.get('', (req, res) => {
    const filePath = path.join(__dirname, '../../client/pages/mainPage/index.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Ошибка при отправке файла:', err);
            res.status(err.status).end();
        }
    });
});
router.get('/patient', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/pages/patientPage/index-p.html'));

});
router.get('/department', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/pages/myDepartmentPage/index-md.html'));

});
router.get('/appointment', (req, res) => {
    console.log('in index js check');
    res.sendFile(path.join(__dirname,
        '../../client/pages/patientAppointmentsPage/index-p-a.html'));
});
router.get('/medicalrecord', (req, res) => {
    console.log('in index js check1');
    res.sendFile(path.join(__dirname,
        '../../client/pages/patientMedicalRecordPage/index-p-mr.html'));
});
router.get('/specialist', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/pages/specialistPage/index-s.html'));
});
router.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/pages/adminPage/index-a.html'));
});

const transporter = nodemailer.createTransport({
    host: 'smtp.rambler.ru',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

router.post('/reset-password', async (req, res) => {
    const { gmail } = req.body;

    try {
        const patientEntry = await PatientEnter.findOne({ where: { gmail } });
        if (patientEntry) {
            const patientId = patientEntry.patientId;
            const patientDetails = await Patient.findOne({ where: { id: patientId } });

            if (patientDetails) {
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: gmail,
                    subject: 'ГОРОДСКАЯ ПОЛИКЛИНИКА №16. Восстановление пароля',
                    text: `Здравствуйте, ${patientDetails.surname} ${patientDetails.name} ${patientDetails.secondname}! Напоминаем, что ваш пароль: ${patientEntry.password}. Больше не забывайте ;)`
                };

                await transporter.sendMail(mailOptions);
                return res.status(200).send('Письмо отправлено. Проверьте вашу почту.');
            } else {
                return res.status(404).send('Детали пациента не найдены.');
            }
        } else {
            return res.status(404).send('Пользователь с таким email не найден.');
        }
    } catch (error) {
        console.error('Ошибка при восстановлении пароля:', error);
        return res.status(500).send('Ошибка сервера.');
    }
});

module.exports = router;