const sequelize = require('../db');

class AdminController {

    async login(req, res) {
        const { password } = req.body;
        try {
            const result = await sequelize.query(
                `SELECT a.id, a.username 
                 FROM admins a
                 WHERE a.password = :password`,
                {
                    replacements: { password },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (result.length > 0) {
                const user = result[0];
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    password: user.password,
                    role: 'admin'
                };

                console.log('User saved in session:', req.session.user);

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    fullName: `${user.username}`,
                    role: 'admin'
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
    }

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
                fullName: `${user.username}`,
                role: user.role
            },
            message: `Здравствуйте, ${user.username}`
        });
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

    async updatep(req, res) {
        const { id } = req.params;
        const updates = req.body;
        const user = req.user;

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

    async updatesp(req, res) {
        const { id } = req.params;
        const updates = req.body;

        console.log('Полученные данные для обновления:', updates);

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

            const specialistFields = ['surname', 'name', 'secondname', 'speciality', 'cabinet', 'departmentId'];
            const updatedSpecialistFields = {};

            for (const key of specialistFields) {
                if (updates[key] !== undefined) {
                    updatedSpecialistFields[key] = updates[key];
                }
            }

            if (Object.keys(updatedSpecialistFields).length > 0) {
                console.log('Обновляем основные данные специалиста:', updatedSpecialistFields);
                await sequelize.query(
                    'UPDATE Specialists SET ' +
                    Object.keys(updatedSpecialistFields).map(key => `${key} = :${key}`).join(', ') +
                    ' WHERE id = :id',
                    {
                        replacements: { ...updatedSpecialistFields, id },
                        type: sequelize.QueryTypes.UPDATE
                    }
                );
                console.log('Основные данные специалиста обновлены.');
            } else {
                console.log('Нет данных для обновления основных данных специалиста.');
            }

            const personalInfoUpdates = {};
            const personalInfoFields = ['birthdate', 'adress', 'phonenumber'];

            for (const key of personalInfoFields) {
                if (updates[key] !== undefined) {
                    personalInfoUpdates[key] = updates[key];
                }
            }

            if (Object.keys(personalInfoUpdates).length > 0) {
                console.log('Обновляем персональную информацию:', personalInfoUpdates);
                await sequelize.query(
                    'UPDATE SpecialistPersonalInfos SET ' +
                    Object.keys(personalInfoUpdates).map(key => `${key} = :${key}`).join(', ') +
                    ' WHERE specialistId = :id',
                    {
                        replacements: { ...personalInfoUpdates, id },
                        type: sequelize.QueryTypes.UPDATE
                    }
                );
                console.log('Персональная информация обновлена.');
            } else {
                console.log('Нет данных для обновления персональной информации.');
            }

            const scheduleUpdates = {};
            const scheduleFields = ['weekdays', 'starttime', 'endtime'];

            for (const key of scheduleFields) {
                if (updates[key] !== undefined) {
                    scheduleUpdates[key] = updates[key];
                }
            }

            if (Object.keys(scheduleUpdates).length > 0) {
                console.log('Обновляем график работы:', scheduleUpdates);
                await sequelize.query(
                    'UPDATE SpecialistSchedules SET ' +
                    Object.keys(scheduleUpdates).map(key => `${key} = :${key}`).join(', ') +
                    ' WHERE specialistId = :id',
                    {
                        replacements: { ...scheduleUpdates, id },
                        type: sequelize.QueryTypes.UPDATE
                    }
                );
                console.log('График работы обновлен.');
            } else {
                console.log('Нет данных для обновления графика работы.');
            }

            const enterUpdates = {};
            const enterFields = ['password'];

            for (const key of enterFields) {
                if (updates[key] !== undefined) {
                    enterUpdates[key] = updates[key];
                }
            }

            if (Object.keys(enterUpdates).length > 0) {
                console.log('Обновляем enter работы:', enterUpdates);
                await sequelize.query(
                    'UPDATE SpecialistEnters SET ' +
                    Object.keys(enterUpdates).map(key => `${key} = :${key}`).join(', ') +
                    ' WHERE specialistId = :id',
                    {
                        replacements: { ...enterUpdates, id },
                        type: sequelize.QueryTypes.UPDATE
                    }
                );
                console.log('График enter обновлен.');
            } else {
                console.log('Нет данных для обновления enter работы.');
            }

            const [updatedSpecialist] = await sequelize.query(
                'SELECT * FROM Specialists WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [updatedPersonalInfo] = await sequelize.query(
                'SELECT * FROM SpecialistPersonalInfos WHERE specialistId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const [updatedSchedule] = await sequelize.query(
                'SELECT * FROM SpecialistSchedules WHERE specialistId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            const [updatedEnter] = await sequelize.query(
                'SELECT * FROM SpecialistEnters WHERE specialistId = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT
                }
            );
            console.log('Обновленные данные специалиста:', updatedSpecialist);
            console.log('Обновленные данные о персональной информации:', updatedPersonalInfo);
            console.log('Обновленные данные о графике работы:', updatedSchedule);
            console.log('Обновленные данные enter специалиста:', updatedEnter);
            return res.json({
                specialist: updatedSpecialist,
                personalInfo: updatedPersonalInfo,
                schedule: updatedSchedule,
                enter: updatedEnter
            });
        } catch (error) {
            console.error('Ошибка при обновлении специалиста:', error);
            return res.status(500).json({ error: 'Ошибка при обновлении специалиста' });
        }
    }




    async deletepatient(req, res) { //админ
        const { id } = req.params;

        const transaction = await sequelize.transaction(); // Начинаем транзакцию

        try {
            // Ищем пациента по ID
            const [patient] = await sequelize.query(
                'SELECT * FROM Patients WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction // Передаем транзакцию
                }
            );

            if (!patient) {
                return res.status(404).json({ error: 'Пациент не найден' });
            }

            // Получаем все медицинские записи пациента
            const medicalRecords = await sequelize.query(
                'SELECT * FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction // Передаем транзакцию
                }
            );

            // Удаляем все записи из MedicalRecordAppointments для каждой медицинской записи
            await Promise.all(medicalRecords.map(record =>
                sequelize.query(
                    'DELETE FROM MedicalRecordAppointments WHERE medicalrecordId = :medicalrecordId',
                    {
                        replacements: { medicalrecordId: record.id },
                        type: sequelize.QueryTypes.DELETE,
                        transaction // Передаем транзакцию
                    }
                )
            ));

            // Удаляем все медицинские карты пациента
            await sequelize.query(
                'DELETE FROM MedicalRecords WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Удаляем запись о пациенте из PatientEnters
            await sequelize.query(
                'DELETE FROM PatientEnters WHERE patientId = :patientId',
                {
                    replacements: { patientId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Удаляем пациента
            await sequelize.query(
                'DELETE FROM Patients WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Если все прошло успешно, коммитим транзакцию
            await transaction.commit();
            return res.status(204).send(); // Возвращаем статус 204 (No Content) после успешного удаления

        } catch (error) {
            await transaction.rollback(); // Откатываем транзакцию в случае ошибки
            console.error('Ошибка при удалении пациента:', error);
            return res.status(500).json({ error: 'Ошибка при удалении пациента' });
        }
    }


    async createspec(req, res) { //админ
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

        const transaction = await sequelize.transaction(); // Начинаем транзакцию

        try {
            // Проверяем, существует ли отдел
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

            // Создаем нового специалиста
            await sequelize.query(
                'INSERT INTO Specialists (surname, name, secondname, speciality, cabinet, departmentId) VALUES (:surname, :name, :secondname, :speciality, :cabinet, :departmentID)',
                {
                    replacements: { surname, name, secondname, speciality, cabinet, departmentID },
                    transaction
                }
            );

            // Получаем ID нового специалиста
            const [result] = await sequelize.query('SELECT LAST_INSERT_ID() AS id', { transaction });
            const specialistId = result[0].id;

            // Сохраняем данные для входа
            await sequelize.query(
                'INSERT INTO SpecialistEnters ( password, specialistId) VALUES ( :password, :specialistId)',
                {
                    replacements: { password, specialistId },
                    transaction
                }
            );

            // Сохраняем личную информацию
            await sequelize.query(
                'INSERT INTO SpecialistPersonalInfos (phonenumber, adress, birthdate, specialistId) VALUES (:phonenumber, :adress, :birthdate, :specialistId)',
                {
                    replacements: { phonenumber, adress, birthdate, specialistId },
                    transaction
                }
            );

            // Сохраняем расписание
            await sequelize.query(
                'INSERT INTO SpecialistSchedules (weekdays, starttime, endtime, specialistId) VALUES (:weekdays, :starttime, :endtime, :specialistId)',
                {
                    replacements: { weekdays, starttime, endtime, specialistId },
                    transaction
                }
            );

            // Подтверждаем транзакцию
            await transaction.commit();

            return res.json({
                specialist: { id: specialistId, surname, name, secondname, speciality, cabinet, departmentID },
                personalinfo: { phonenumber, adress, birthdate },
                schedule: { weekdays, starttime, endtime },
                enter: { password }
            });

        } catch (error) {
            await transaction.rollback(); // Откатываем транзакцию в случае ошибки
            console.error('Ошибка при создании специалиста:', error);
            return res.status(500).json({ error: 'Ошибка при создании специалиста', details: error.message });
        }
    };


    async deletespec(req, res) { //админ
        const { id } = req.params;

        const transaction = await sequelize.transaction(); // Начинаем транзакцию

        try {
            // Находим специалиста по ID
            const [specialist] = await sequelize.query(
                'SELECT * FROM Specialists WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.SELECT,
                    transaction // Передаем транзакцию
                }
            );

            if (!specialist) {
                return res.status(404).json({ error: 'Специалист не найден' });
            }




            // Удаляем записи из MedicalRecordAppointments, связанные с этими талонами
            await sequelize.query(
                'DELETE FROM MedicalRecordAppointments WHERE appointmentId IN (SELECT id FROM Appointments WHERE specialistId = :specialistId)',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );
            await sequelize.query(
                'DELETE FROM Appointments WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );
            // Удаляем связанные данные о входе
            await sequelize.query(
                'DELETE FROM SpecialistEnters WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Удаляем связанное расписание
            await sequelize.query(
                'DELETE FROM SpecialistSchedules WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Удаляем личную информацию
            await sequelize.query(
                'DELETE FROM SpecialistPersonalInfos WHERE specialistId = :specialistId',
                {
                    replacements: { specialistId: id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Удаляем запись специалиста
            await sequelize.query(
                'DELETE FROM Specialists WHERE id = :id',
                {
                    replacements: { id },
                    type: sequelize.QueryTypes.DELETE,
                    transaction // Передаем транзакцию
                }
            );

            // Если все прошло успешно, коммитим транзакцию
            await transaction.commit();
            return res.status(204).send(); // Возвращаем статус 204 (No Content) после успешного удаления

        } catch (error) {
            await transaction.rollback(); // Откатываем транзакцию в случае ошибки
            console.error('Ошибка при удалении специалиста:', error);
            return res.status(500).json({ error: 'Ошибка при удалении специалиста' });
        }
    };
};

module.exports = new AdminController(); //через . обращаться к функциям