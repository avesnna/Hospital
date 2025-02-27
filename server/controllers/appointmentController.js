const ApiError = require('../error/ApiError');
const { Specialist, Patient, Appointment, MedicalRecord, MedicalRecordAppointments } = require('../models/models');
const sequelize = require('../db');

class AppointmentController {

    async create(req, res) {
        const user = req.user;
        const { date, time, specialistId } = req.body;
        const patientId = user.role === 'patient' ? user.id : req.body.patientId;
        const specialistIdToUse = user.role === 'specialist' ? user.id : specialistId;
        const transaction = await sequelize.transaction();

        try {
            const [patient] = await sequelize.query(
                'SELECT * FROM Patients WHERE id = :patientId',
                { replacements: { patientId }, type: sequelize.QueryTypes.SELECT, transaction }
            );

            if (!patient) {
                return res.status(404).json({ message: 'Пациент не существует' });
            }

            const [specialist] = await sequelize.query(
                'SELECT s.id, ss.weekdays, ss.startTime, ss.endTime FROM Specialists s ' +
                'JOIN SpecialistSchedules ss ON s.id = ss.specialistId WHERE s.id = :specialistId',
                { replacements: { specialistId: specialistIdToUse }, type: sequelize.QueryTypes.SELECT, transaction }
            );

            if (!specialist) {
                return res.status(404).json({ message: 'Специалист не существует или у него нет графика' });
            }

            if (!specialist.weekdays || typeof specialist.weekdays !== 'string' || !specialist.weekdays.trim()) {
                return res.status(400).json({ message: 'Specialist weekdays are not defined correctly' });
            }

            const appointmentDate = new Date(date);
            const appointmentDay = appointmentDate.toLocaleString('ru-RU', { weekday: 'long' });

            const weekDays = {
                'понедельник': 'пн',
                'вторник': 'вт',
                'среда': 'ср',
                'четверг': 'чт',
                'пятница': 'пт',
                'суббота': 'сб',
                'воскресенье': 'вс'
            };

            const appointmentWeekDay = weekDays[appointmentDay];

            if (user.role !== 'specialist') {
                const daysOfWeek = specialist.weekdays.split(' ').map(day => day.trim());
                if (!daysOfWeek.includes(appointmentWeekDay)) {
                    return res.status(400).json({ message: 'Appointment date does not match specialist workdays' });
                }
            }

            const [startHour, startMinute] = specialist.startTime.split(':').map(Number);
            const [endHour, endMinute] = specialist.endTime.split(':').map(Number);
            const [appointmentHour, appointmentMinute] = time.split(':').map(Number);

            const startTime = new Date(appointmentDate);
            startTime.setHours(startHour, startMinute, 0);

            const endTime = new Date(appointmentDate);
            endTime.setHours(endHour, endMinute, 0);

            const appointmentTime = new Date(appointmentDate);
            appointmentTime.setHours(appointmentHour, appointmentMinute, 0);

            if (appointmentTime < startTime || appointmentTime > endTime) {
                return res.status(400).json({ message: 'Appointment time must be within specialist working hours' });
            }

            const [medicalRecord] = await sequelize.query(
                'SELECT * FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );
            if (!medicalRecord) {
                return res.status(404).json({ message: 'Medical record does not exist for this patient' });
            }

            await sequelize.query(
                'INSERT INTO Appointments (date, time, status, specialistId, patientId) VALUES (:date, :time, :status, :specialistId, :patientId)',
                {
                    replacements: { date, time, status: 'active', specialistId: specialistIdToUse, patientId },
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                }
            );

            const [appointmentIdResult] = await sequelize.query(
                'SELECT LAST_INSERT_ID() AS id',
                {
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            const appointmentId = appointmentIdResult.id;

            await sequelize.query(
                'INSERT INTO MedicalRecordAppointments (medicalrecordId, appointmentId) VALUES (:medicalRecordId, :appointmentId)',
                {
                    replacements: { medicalRecordId: medicalRecord.id, appointmentId },
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                }
            );

            await transaction.commit();
            return res.status(200).json({ message: 'Талон успешно оформлен!', appointmentId });
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при создании записи:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getAll(req, res) {

        const user = req.user;

        try {
            let appointments;

            if (user.role === 'admin') {
                appointments = await sequelize.query(
                    `SELECT a.id AS appointmentId, a.time, a.date,   s.speciality, s.cabinet,
                                CONCAT(p.surname, ' ', p.name, ' ', p.secondname) AS patientFullName,
                                CONCAT(s.surname, ' ', s.name, ' ', s.secondname) AS specialistFullName
                         FROM Appointments a
                         JOIN Patients p ON a.patientId = p.id
                         JOIN Specialists s ON a.specialistId = s.id`,
                    {
                        type: sequelize.QueryTypes.SELECT
                    }
                );
            } else if (user.role === 'specialist') {
                appointments = await sequelize.query(
                    `SELECT a.id AS appointmentId, 
                                CONCAT(p.surname, ' ', p.name, ' ', p.secondname) AS patientFullName,
                                CONCAT(s.surname, ' ', s.name, ' ', s.secondname) AS specialistFullName
                         FROM Appointments a
                         JOIN Patients p ON a.patientId = p.id
                         JOIN Specialists s ON a.specialistId = s.id
                         WHERE a.specialistId = :specialistId`,
                    {
                        replacements: { specialistId: user.id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );
            } else if (user.role === 'patient') {
                appointments = await sequelize.query(
                    `SELECT a.id AS appointmentId, a.date, 
                    a.time, 
                     s.speciality, s.cabinet,
                                CONCAT(p.surname, ' ', p.name, ' ', p.secondname) AS patientFullName,
                                CONCAT(s.surname, ' ', s.name, ' ', s.secondname) AS specialistFullName
                         FROM Appointments a
                         JOIN Patients p ON a.patientId = p.id
                         JOIN Specialists s ON a.specialistId = s.id
                         WHERE a.patientId = :patientId`,
                    {
                        replacements: { patientId: user.id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );
            } else {
                return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
            }

            return res.json(appointments);
        } catch (error) {
            console.error('Ошибка при получении назначений:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }

    };

    async getByID(req, res) {
        const { id } = req.params;

        try {
            const appointmentData = await sequelize.query(
                `SELECT a.id AS appointmentId, 
                        a.date, 
                        a.time, 
                        a.status,
                        CONCAT(p.surname, ' ', p.name, ' ', p.secondname) AS patientFullName,
                        p.id AS patientId,
                        CONCAT(s.surname, ' ', s.name, ' ', s.secondname) AS specialistFullName,
                        s.id AS specialistId,
                        s.speciality, s.cabinet
                       
                 FROM Appointments a
                 JOIN Patients p ON a.patientId = p.id
                 JOIN Specialists s ON a.specialistId = s.id`,
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (appointmentData.length === 0) {
                return res.status(404).json({ error: 'Талон не найден' });
            }

            const appointment = appointmentData[0];

            return res.json({
                appointment: {
                    id: appointment.appointmentId,
                    date: appointment.date,
                    time: appointment.time,
                    status: appointment.status,
                    patient: {
                        id: appointment.patientId,
                        fullName: appointment.patientFullName,
                    },
                    specialist: {
                        id: appointment.specialistId,
                        fullName: appointment.specialistFullName,
                        speciality: appointment.speciality,
                        cabinet: appointment.cabinet
                    }
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка при получении талона' });
        }
    };

    async delete(req, res) {
        const { id } = req.params;

        try {
            const appointment = await sequelize.query(
                'SELECT * FROM Appointments WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (appointment.length === 0) {
                return res.status(404).json({ error: 'Талон не найден' });
            }

            await sequelize.query(
                'DELETE FROM MedicalRecordAppointments WHERE appointmentId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.DELETE
                }
            );

            await sequelize.query(
                'DELETE FROM Appointments WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.DELETE
                }
            );

            return res.status(201).json({ message: 'Талон успешно удалён' });
        } catch (error) {
            console.error('Ошибка при удалении талона:', error);
            return res.status(500).json({ error: 'Ошибка при удалении талона' });
        }
    };
};

module.exports = new AppointmentController(); 