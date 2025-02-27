const ApiError = require('../error/ApiError');
const { Specialist, SpecialistEnter, SpecialistPersonalInfo, SpecialistSchedule, Department } = require('../models/models');
const sequelize = require('../db');

class SpecialistController {

    async login(req, res) {
        const { password } = req.body;

        try {
            const result = await sequelize.query(
                `SELECT s.id, s.surname, s.name, s.secondname, s.departmentId
                 FROM specialists s 
                 JOIN specialistenters se ON se.SpecialistID = s.id 
                 WHERE se.password = :password`,
                {
                    replacements: { password },
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
                    role: 'specialist',
                    departmentId: user.departmentId
                };

                console.log('User saved in session:', req.session.user);

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    fullName: `${user.surname} ${user.name} ${user.secondname}`
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password'
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

    async check(req, res) {
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
            message: 'User is logged in',
            user: {
                id: user.id,
                fullName: `${user.surname} ${user.name} ${user.secondname}`,
                role: user.role,
                departmentId: user.departmentId
            },
            message: `Здравствуйте, ${user.surname} ${user.name} ${user.secondname}`
        });

    };

    async create(req, res) {
        const {
            surname,
            name,
            secondname,
            speciality,
            cabinet,
            departmentID,
            personalinfo,
            schedule,
            enter
        } = req.body;

        if (!personalinfo || !schedule || !enter) {
            return res.status(400).json({ error: 'Недостаточно данных для создания специалиста' });
        }

        const { phonenumber, adress, birthdate } = personalinfo;
        const { weekdays, starttime, endtime } = schedule;
        const { password } = enter;

        const transaction = await sequelize.transaction();

        try {
            const [departments] = await sequelize.query(
                'SELECT * FROM Departments WHERE id = :departmentID',
                {
                    replacements: { departmentID },
                    transaction
                }
            );

            if (departments.length === 0) {
                return res.status(404).json({ error: 'Отделение не найдено' });
            }

            await sequelize.query(
                'INSERT INTO Specialists (surname, name, secondname, speciality, cabinet, departmentId) VALUES (:surname, :name, :secondname, :speciality, :cabinet, :departmentID)',
                {
                    replacements: { surname, name, secondname, speciality, cabinet, departmentID },
                    transaction
                }
            );

            const [result] = await sequelize.query('SELECT LAST_INSERT_ID() AS id', { transaction });
            const specialistId = result[0].id;

            await sequelize.query(
                'INSERT INTO SpecialistEnters ( password, specialistId) VALUES ( :password, :specialistId)',
                {
                    replacements: { password, specialistId },
                    transaction
                }
            );

            await sequelize.query(
                'INSERT INTO SpecialistPersonalInfos (phonenumber, adress, birthdate, specialistId) VALUES (:phonenumber, :adress, :birthdate, :specialistId)',
                {
                    replacements: { phonenumber, adress, birthdate, specialistId },
                    transaction
                }
            );

            await sequelize.query(
                'INSERT INTO SpecialistSchedules (weekdays, starttime, endtime, specialistId) VALUES (:weekdays, :starttime, :endtime, :specialistId)',
                {
                    replacements: { weekdays, starttime, endtime, specialistId },
                    transaction
                }
            );

            await transaction.commit();

            return res.json({
                specialist: { id: specialistId, surname, name, secondname, speciality, cabinet, departmentID },
                personalinfo: { phonenumber, adress, birthdate },
                schedule: { weekdays, starttime, endtime },
                enter: { password }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при создании специалиста:', error);
            return res.status(500).json({ error: 'Ошибка при создании специалиста', details: error.message });
        }
    };

    async getAll(req, res) {
        const specialists = await sequelize.query(
            'SELECT * FROM Specialists',
            {
                type: sequelize.QueryTypes.SELECT
            }
        );

        const specialistMap = {};
        const specialistsData = [];

        await Promise.all(specialists.map(async (specialist) => {
            if (!specialistMap[specialist.id]) {
                specialistMap[specialist.id] = {
                    id: specialist.id,
                    surname: specialist.surname,
                    name: specialist.name,
                    secondname: specialist.secondname,
                    speciality: specialist.speciality,
                    cabinet: specialist.cabinet,
                    department: null,
                    personalinfo: null,
                    schedule: null,
                    enter: null
                };

                const [department] = await sequelize.query(
                    'SELECT * FROM Departments WHERE id = :departmentId',
                    {
                        replacements: { departmentId: specialist.departmentId },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (department) {
                    specialistMap[specialist.id].department = {
                        name: department.name,
                        id: department.id
                    };
                }

                const [specialistPersonalInfo] = await sequelize.query(
                    'SELECT * FROM SpecialistPersonalInfos WHERE specialistId = :specialistId',
                    {
                        replacements: { specialistId: specialist.id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (specialistPersonalInfo) {
                    specialistMap[specialist.id].personalinfo = {
                        phonenumber: specialistPersonalInfo.phonenumber,
                        adress: specialistPersonalInfo.adress,
                        birthdate: specialistPersonalInfo.birthdate,

                    };
                }

                const [specialistSchedule] = await sequelize.query(
                    'SELECT * FROM SpecialistSchedules WHERE specialistId = :specialistId',
                    {
                        replacements: { specialistId: specialist.id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (specialistSchedule) {
                    specialistMap[specialist.id].schedule = {
                        weekdays: specialistSchedule.weekdays,
                        starttime: specialistSchedule.starttime,
                        endtime: specialistSchedule.endtime
                    };
                }
                const [specialistEnter] = await sequelize.query(
                    'SELECT * FROM SpecialistEnters WHERE specialistId = :specialistId',
                    {
                        replacements: { specialistId: specialist.id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (specialistEnter) {
                    specialistMap[specialist.id].enter = {
                        password: specialistEnter.password
                    };
                }

                specialistsData.push(specialistMap[specialist.id]);
            }
        }));

        return res.json(specialistsData);
    }

    async getByID(req, res) {
        const specialistId = req.session.user.role === 'specialist'
            ? req.session.user.id
            : req.params.id;

        try {
            const [specialist] = await sequelize.query(
                'SELECT * FROM Specialists WHERE id = :id',
                {
                    replacements: { id: specialistId },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!specialist) {
                return res.status(404).json({ error: 'Специалист не найден' });
            }

            const [department] = await sequelize.query(
                'SELECT * FROM Departments WHERE id = :departmentId',
                {
                    replacements: { departmentId: specialist.departmentId },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [specialistPersonalInfo] = await sequelize.query(
                'SELECT * FROM SpecialistPersonalInfos WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: specialist.id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [specialistSchedule] = await sequelize.query(
                'SELECT * FROM SpecialistSchedules WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: specialist.id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [specialistEnter] = await sequelize.query(
                'SELECT * FROM SpecialistEnters WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: specialist.id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            return res.json({
                specialist,
                department: department ? {
                    name: department.name,
                    id: department.id
                } : null,
                personalinfo: specialistPersonalInfo ? {
                    phonenumber: specialistPersonalInfo.phonenumber,
                    adress: specialistPersonalInfo.adress,
                    birthdate: specialistPersonalInfo.birthdate
                } : null,
                schedule: specialistSchedule ? {
                    weekdays: specialistSchedule.weekdays,
                    starttime: specialistSchedule.starttime,
                    endtime: specialistSchedule.endtime
                } : null,
                enter: specialistEnter ? {
                    password: specialistEnter.password
                } : null
            });

        } catch (error) {
            console.error('Ошибка при получении специалиста по ID:', error);
            return res.status(500).json({ error: 'Ошибка при получении специалиста' });
        }
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

    async update(req, res) {
        const { id } = req.params;
        const updates = req.body;

        try {
            const [specialist] = await sequelize.query(
                'SELECT * FROM Specialists WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!specialist) {
                return res.status(404).json({ error: 'Специалист не найден' });
            }

            if (updates.departmentId) {
                const [department] = await sequelize.query(
                    'SELECT * FROM Departments WHERE id = :departmentId',
                    {
                        replacements: { departmentId: updates.departmentId },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (!department) {
                    return res.status(404).json({ error: 'Отделение не найдено' });
                }
            }

            const specialistFields = ['surname', 'name', 'secondname', 'speciality', 'cabinet', 'departmentId'];
            const updatedSpecialistFields = {};
            for (const key of specialistFields) {
                if (updates[key] !== undefined) {
                    updatedSpecialistFields[key] = updates[key];
                }
            }

            if (Object.keys(updatedSpecialistFields).length > 0) {
                await sequelize.query(
                    'UPDATE Specialists SET ' +
                    Object.keys(updatedSpecialistFields).map(key => `${key} = :${key}`).join(', ') +
                    ' WHERE id = :id',
                    {
                        replacements: { ...updatedSpecialistFields, id },
                        type: sequelize.QueryTypes.UPDATE
                    }
                );
            }

            if (updates.enter) {
                const { password, gmail } = updates.enter;

                const [enterRecord] = await sequelize.query(
                    'SELECT * FROM SpecialistEnters WHERE specialistId = :id',
                    {
                        replacements: { id },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                const enterUpdates = {};
                if (gmail) enterUpdates.gmail = gmail;
                if (password) enterUpdates.password = password;

                if (Object.keys(enterUpdates).length > 0) {
                    await sequelize.query(
                        'UPDATE SpecialistEnters SET ' +
                        Object.keys(enterUpdates).map(key => `${key} = :${key}`).join(', ') +
                        ' WHERE specialistId = :id',
                        {
                            replacements: { ...enterUpdates, id },
                            type: sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }

            if (updates.schedule) {
                const { weekdays, starttime, endtime } = updates.schedule;

                const scheduleUpdates = {};
                if (weekdays) scheduleUpdates.weekdays = weekdays;
                if (starttime) scheduleUpdates.starttime = starttime;
                if (endtime) scheduleUpdates.endtime = endtime;

                if (Object.keys(scheduleUpdates).length > 0) {
                    await sequelize.query(
                        'UPDATE SpecialistSchedules SET ' +
                        Object.keys(scheduleUpdates).map(key => `${key} = :${key}`).join(', ') +
                        ' WHERE specialistId = :id',
                        {
                            replacements: { ...scheduleUpdates, id },
                            type: sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }

            if (updates.personalInfo) {
                const { phonenumber, adress, birthdate } = updates.personalInfo;
                const personalInfoUpdates = {};
                if (phonenumber) personalInfoUpdates.phonenumber = phonenumber;
                if (adress) personalInfoUpdates.adress = adress;
                if (birthdate) personalInfoUpdates.birthdate = birthdate;
                if (Object.keys(personalInfoUpdates).length > 0) {
                    await sequelize.query(
                        'UPDATE SpecialistPersonalInfos SET ' +
                        Object.keys(personalInfoUpdates).map(key => `${key} = :${key}`).join(', ') +
                        ' WHERE specialistId = :id',
                        {
                            replacements: { ...personalInfoUpdates, id },
                            type: sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }

            const [updatedSpecialist] = await sequelize.query(
                'SELECT * FROM Specialists WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [department] = await sequelize.query(
                'SELECT name FROM Departments WHERE id = :departmentId',
                {
                    replacements: { departmentId: updatedSpecialist.departmentId },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [specialistPersonalInfo] = await sequelize.query(
                'SELECT phonenumber, adress, birthdate FROM SpecialistPersonalInfos WHERE specialistId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [specialistSchedule] = await sequelize.query(
                'SELECT weekdays, starttime, endtime FROM SpecialistSchedules WHERE specialistId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [specialistEnter] = await sequelize.query(
                'SELECT password FROM SpecialistEnters WHERE specialistId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            return res.json({
                specialist: updatedSpecialist,
                department: department ? department.name : null,
                personalinfo: specialistPersonalInfo ? {
                    phonenumber: specialistPersonalInfo.phonenumber,
                    adress: specialistPersonalInfo.adress,
                    birthdate: specialistPersonalInfo.birthdate
                } : null,
                schedule: specialistSchedule ? {
                    weekdays: specialistSchedule.weekdays,
                    starttime: specialistSchedule.starttime,
                    endtime: specialistSchedule.endtime
                } : null,
                enter: specialistEnter ? {
                    password: specialistEnter.password
                } : null
            });
        } catch (error) {
            console.error('Ошибка при обновлении специалиста:', error);
            return res.status(500).json({ error: 'Ошибка при обновлении специалиста' });
        }
    };

    async delete(req, res) {
        const { id } = req.params;

        const transaction = await sequelize.transaction();

        try {
            const [specialist] = await sequelize.query(
                'SELECT * FROM Specialists WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction
                }
            );

            if (!specialist) {
                return res.status(404).json({ error: 'Специалист не найден' });
            }

            await sequelize.query(
                'DELETE FROM MedicalRecordAppointments WHERE appointmentId IN (SELECT id FROM Appointments WHERE specialistId = :specialistId)',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM Appointments WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM SpecialistEnters WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM SpecialistSchedules WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM SpecialistPersonalInfos WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction
                }
            );

            await sequelize.query(
                'DELETE FROM Specialists WHERE id = :id',
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
            console.error('Ошибка при удалении специалиста:', error);
            return res.status(500).json({ error: 'Ошибка при удалении специалиста' });
        }
    };
};

module.exports = new SpecialistController();