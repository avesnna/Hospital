const ApiError = require('../error/ApiError');
const { Patient, PatientEnter, MedicalRecord, MedicalRecordAppointments } = require('../models/models');
const sequelize = require('../db');

class PatientController {

    async registration(req, res, next) {
        const transaction = await sequelize.transaction();

        try {
            const {
                surname,
                name,
                secondname,
                gender,
                birthdate,
                phonenumber,
                adress,
                enter
            } = req.body;

            if (
                !surname || !name || !secondname ||
                !gender || !birthdate || !phonenumber ||
                !adress || !enter || typeof enter !== 'object' ||
                !enter.gmail || !enter.password
            ) {
                return next(ApiError.badRequest('Некорректные данные для регистрации'));
            }

            const [candidate] = await sequelize.query(
                'SELECT * FROM PatientEnters WHERE gmail = :gmail',
                {
                    replacements: { gmail: enter.gmail },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (candidate) {
                return next(ApiError.badRequest('Пользователь с такой почтой уже существует'));
            }

            const [patientResult] = await sequelize.query(
                'INSERT INTO Patients (surname, name, secondname, gender, birthdate, phonenumber, adress) VALUES (:surname, :name, :secondname, :gender, :birthdate, :phonenumber, :adress)',
                {
                    replacements: {
                        surname,
                        name,
                        secondname,
                        gender,
                        birthdate,
                        phonenumber,
                        adress
                    },
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                }
            );

            const patientId = await sequelize.query('SELECT LAST_INSERT_ID() AS id', { transaction });

            await sequelize.query(
                'INSERT INTO PatientEnters (password, gmail, patientId) VALUES (:password, :gmail, :patientId)',
                {
                    replacements: {
                        password: enter.password,
                        gmail: enter.gmail,
                        patientId: patientId[0][0].id
                    },
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                }
            );

            const [medicalRecordResult] = await sequelize.query(
                'INSERT INTO MedicalRecords (patientId) VALUES (:patientId)',
                {
                    replacements: { patientId: patientId[0][0].id },
                    type: sequelize.QueryTypes.INSERT,
                    transaction
                }
            );
            await transaction.commit();
            return res.status(201).json({ message: 'Регистрация успешна' });

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при регистрации:', error);
            return next(ApiError.internal('Ошибка при регистрации'));
        }
    };

    async login(req, res, next) {
        const { gmail, password } = req.body;

        try {
            const result = await sequelize.query(
                `SELECT p.id, p.surname, p.name, p.secondname 
                 FROM Patients p 
                 JOIN PatientEnters pe ON pe.patientId = p.id 
                 WHERE pe.gmail = :gmail AND pe.password = :password`,
                {
                    replacements: { gmail, password },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (result.length > 0) {
                const user = result[0];
                req.session.user = {
                    id: user.id,
                    surname: user.surname,
                    name: user.name,
                    secondname: user.secondname,
                    role: 'patient'
                };

                console.log('User saved in session:', req.session.user);

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    role: user.role,
                    fullName: `${user.surname} ${user.name} ${user.secondname}`
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }
        } catch (error) {
            console.error('Error during login:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred during login'
            });
        }
    };

    async check(req, res, next) {
        console.log('Check method called');
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not logged in'
            });
        }

        return res.status(200).json({
            success: true,

            user: {
                id: user.id,
                fullName: `${user.surname} ${user.name} ${user.secondname}`,
                role: user.role
            },
            message: `Здравствуйте, ${user.surname} ${user.name} ${user.secondname}`
        });
        next();
    }

    async logout(req, res, next) {
        console.log('Сессия перед выходом:', req.session);
        if (req.session && req.session.user) {
            req.session.destroy(err => {
                if (err) {
                    console.error('Ошибка при уничтожении сессии:', err);
                    return res.status(500).json({ message: 'Ошибка при выходе из системы' });
                }
                res.clearCookie('connect.sid');
                return res.status(200).json({ message: 'Вы вышли из системы' });
            });
        } else {
            console.log('Сессия не найдена или пользователь не аутентифицирован');
            return res.status(400).json({ message: 'Вы уже вышли из системы' });
        }
    }

    async getAll(req, res) {
        try {
            const userRole = req.session.role;
            const query = `
                SELECT 
                    p.*, 
                    a.id AS appointmentId,  
                    a.date AS appointmentDate, 
                    a.time AS appointmentTime, 
                    a.specialistId, s.speciality,  CONCAT(s.surname, ' ', s.name, ' ', s.secondname) AS specialistFullName, s.cabinet
                FROM 
                    Patients p
                LEFT JOIN 
                    Appointments a ON p.id = a.patientId
                    LEFT JOIN
                    Specialists s ON s.id = a.specialistId
                ORDER BY 
                    p.surname ASC
            `;

            const patientsWithAppointments = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            });

            const patients = [];
            const patientMap = {};

            patientsWithAppointments.forEach(record => {
                if (!patientMap[record.id]) {
                    patientMap[record.id] = {
                        id: record.id,
                        surname: record.surname,
                        name: record.name,
                        secondname: record.secondname,
                        birthdate: record.birthdate,
                        gender: record.gender,
                        phonenumber: record.phonenumber,
                        adress: record.adress,
                        appointments: []
                    };
                    patients.push(patientMap[record.id]);
                }
                if (record.appointmentDate) {
                    patientMap[record.id].appointments.push({
                        id: record.appointmentId,  // ID талона
                        appointmentDate: record.appointmentDate,
                        appointmentTime: record.appointmentTime,
                        specialistId: record.specialistId,
                        speciality: record.speciality,
                        specialistFullName: record.specialistFullName,
                        cabinet: record.cabinet

                    });
                }
            });

            return res.json(patients);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка при получении пациентов' });
        }
    }

    async getByID(req, res) {

        const { id } = req.params;

        try {
            const [patientResult] = await sequelize.query(
                `SELECT *
                 FROM Patients p 
                 WHERE p.id = :id`,
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!patientResult) {
                return res.status(404).json({ error: 'Пациент не найден' });
            }

            const [medicalRecordResult] = await sequelize.query(
                `SELECT id 
                 FROM MedicalRecords 
                 WHERE patientId = :patientId`,
                {
                    replacements: { patientId: patientResult.id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [enterResult] = await sequelize.query(
                `SELECT pe.gmail, pe.password
                 FROM PatientEnters pe
                 WHERE pe.patientId = :patientId`,
                {
                    replacements: { patientId: patientResult.id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            return res.json({
                patient: patientResult,
                enter: enterResult ? { gmail: enterResult.gmail, password: enterResult.password } : null,
                medicalRecordId: medicalRecordResult ? medicalRecordResult.id : null
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Ошибка при получении пациента' });
        }
    }

    async update(req, res) {
        const { id } = req.params;
        const updates = req.body;
        const user = req.user;

        if (user.role == 'admin') {

            try {
                const [patient] = await sequelize.query(
                    'SELECT * FROM Patients WHERE id = :id',
                    {
                        replacements: { id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (!patient) {
                    return res.status(404).json({ error: 'Пациент не найден' });
                }

                const patientFields = ['surname', 'name', 'secondname', 'gender', 'birthdate', 'phonenumber', 'adress'];
                const updatedPatientFields = {};
                for (const key of patientFields) {
                    if (updates[key] !== undefined) {
                        updatedPatientFields[key] = updates[key];
                    }
                }

                if (Object.keys(updatedPatientFields).length > 0) {
                    await sequelize.query(
                        'UPDATE Patients SET ' +
                        Object.keys(updatedPatientFields).map(key => `${key} = :${key}`).join(', ') +
                        ' WHERE id = :id',
                        {
                            replacements: { ...updatedPatientFields, id },
                            type: sequelize.QueryTypes.UPDATE
                        }
                    );
                }

                if (updates.enter) {
                    const { password, gmail } = updates.enter;

                    const [patientEnter] = await sequelize.query(
                        'SELECT * FROM PatientEnters WHERE patientId = :id',
                        {
                            replacements: { id },
                            type: sequelize.QueryTypes.SELECT
                        }
                    );

                    if (patientEnter) {
                        const enterUpdates = {};
                        if (gmail) enterUpdates.gmail = gmail;
                        if (password) enterUpdates.password = password;
                        if (Object.keys(enterUpdates).length > 0) {
                            await sequelize.query(
                                'UPDATE PatientEnters SET ' +
                                Object.keys(enterUpdates).map(key => `${key} = :${key}`).join(', ') +
                                ' WHERE patientId = :id',
                                {
                                    replacements: { ...enterUpdates, id },
                                    type: sequelize.QueryTypes.UPDATE
                                }
                            );
                        }
                    }
                }

                const [updatedPatient] = await sequelize.query(
                    'SELECT * FROM Patients WHERE id = :id',
                    {
                        replacements: { id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                const [updatedEnter] = await sequelize.query(
                    'SELECT gmail, password FROM PatientEnters WHERE patientId = :id',
                    {
                        replacements: { id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                return res.json({
                    patient: updatedPatient,
                    enter: updatedEnter ? { gmail: updatedEnter.gmail, password: updatedEnter.password } : null
                });
            } catch (error) {
                console.error('Ошибка при обновлении данных пациента:', error);
                return res.status(500).json({ error: 'Ошибка при обновлении данных пациента' });
            }
        }
    }

    async delete(req, res) {
        const { id } = req.params;

        const transaction = await sequelize.transaction();

        try {
            const [patient] = await sequelize.query(
                'SELECT * FROM Patients WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (!patient) {
                return res.status(404).json({ error: 'Пациент не найден' });
            }

            const medicalRecords = await sequelize.query(
                'SELECT * FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            await Promise.all(medicalRecords.map(record =>
                sequelize.query(
                    'DELETE FROM MedicalRecordAppointments WHERE medicalrecordId = :medicalrecordId',
                    {
                        replacements: { medicalrecordId: record.id },
                        type: sequelize.QueryTypes.DELETE,
                        transaction
                    }
                )
            ));

            await sequelize.query(
                'DELETE FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM PatientEnters WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM Patients WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await transaction.commit();
            return res.status(204).send();
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при удалении пациента:', error);
            return res.status(500).json({ error: 'Ошибка при удалении пациента' });
        }
    }
};

module.exports = new PatientController(); 