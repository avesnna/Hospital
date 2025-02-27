const ApiError = require('../error/ApiError');
const { Patient, MedicalRecord, MedicalRecordAppointments } = require('../models/models');
const sequelize = require('../db');

class MedicalRecordController {

    async getAll(req, res) {
        try {
            const medicalRecords = await sequelize.query(
                `
                SELECT 
                    MedicalRecords.*, 
                    Patients.surname, 
                    Patients.name, 
                    Patients.secondname 
                FROM 
                    MedicalRecords 
                INNER JOIN 
                    Patients ON MedicalRecords.patientId = Patients.id
                `,
                {
                    type: sequelize.QueryTypes.SELECT
                }
            );

            return res.json(medicalRecords);
        } catch (error) {
            console.error('Ошибка при получении медицинских карт:', error);
            return res.status(500).json({ error: 'Ошибка при получении медицинских карт' });
        }

    };

    async getForUser(req, res) {
        const user = req.user;

        const transaction = await sequelize.transaction();

        try {

            if (user.role !== 'patient') {
                return res.status(403).json({ error: 'Доступ запрещен' });
            }

            const [medicalRecord] = await sequelize.query(
                'SELECT id, patientId FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId: user.id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (!medicalRecord) {
                return res.status(404).json({ error: 'Медицинская карта не найдена' });
            }

            const [patient] = await sequelize.query(
                'SELECT surname, name, secondname, gender, birthdate, adress, phonenumber FROM Patients WHERE id = :patientId',
                {
                    replacements: { patientId: medicalRecord.patientId },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (!patient) {
                return res.status(404).json({ error: 'Пациент не найден для данной медицинской карты' });
            }

            const appointments = await sequelize.query(
                'SELECT appointmentId FROM MedicalRecordAppointments WHERE medicalrecordId = :medicalRecordId',
                {
                    replacements: { medicalRecordId: medicalRecord.id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            const response = {
                medicalRecordId: medicalRecord.id,
                patient: {
                    surname: patient.surname,
                    name: patient.name,
                    secondname: patient.secondname,
                    gender: patient.gender,
                    birthdate: patient.birthdate,
                    adress: patient.adress,
                    phonenumber: patient.phonenumber
                },
                appointmentIds: appointments.map(record => record.appointmentId),
            };

            await transaction.commit();
            return res.json(response);

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при получении медицинской карты:', error);
            return res.status(500).json({ error: 'Ошибка при получении медицинской карты', details: error.message });
        }
    };

    async getById(req, res) {
        const { id } = req.params;
        const user = req.user;
        const transaction = await sequelize.transaction();

        try {

            if (user.role !== 'admin') {
                return res.status(403).json({ error: 'Доступ запрещен' });
            }

            const [medicalRecord] = await sequelize.query(
                'SELECT id, patientId FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (!medicalRecord) {
                return res.status(404).json({ error: 'Медицинская карта не найдена' });
            }

            const [patient] = await sequelize.query(
                'SELECT surname, name, secondname, gender, birthdate, adress, phonenumber FROM Patients WHERE id = :patientId',
                {
                    replacements: { patientId: medicalRecord.patientId },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (!patient) {
                return res.status(404).json({ error: 'Пациент не найден для данной медицинской карты' });
            }

            const appointments = await sequelize.query(
                'SELECT appointmentId FROM MedicalRecordAppointments WHERE medicalrecordId = :medicalRecordId',
                {
                    replacements: { medicalRecordId: medicalRecord.id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            const response = {
                medicalRecordId: medicalRecord.id,
                patient: {
                    surname: patient.surname,
                    name: patient.name,
                    secondname: patient.secondname,
                    gender: patient.gender,
                    birthdate: patient.birthdate,
                    adress: patient.adress,
                    phonenumber: patient.phonenumber
                },
                appointmentIds: appointments.map(record => record.appointmentId),
            };

            await transaction.commit();
            return res.json(response);

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при получении медицинской карты:', error);
            return res.status(500).json({ error: 'Ошибка при получении медицинской карты', details: error.message });
        }
    }
};

module.exports = new MedicalRecordController(); 