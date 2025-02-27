const ApiError = require('../error/ApiError');
const { Department, Specialist } = require('../models/models');
const sequelize = require('../db');

class DepartmentController {

    async create(req, res) {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Имя отдела обязательно' });
        }

        try {
            const result = await sequelize.query(
                'INSERT INTO Departments (name) VALUES (:name)',
                {
                    replacements: { name },
                    type: sequelize.QueryTypes.INSERT
                }
            );

            const id = result[0];

            return res.json({ department: { id, name } });
        } catch (error) {
            console.error('Ошибка при создании отдела:', error);
            return res.status(500).json({ error: 'Ошибка при создании отдела', details: error.message });
        }
    };

    async getAll(req, res) {
        try {
            const [departments] = await sequelize.query('SELECT * FROM Departments ORDER BY id ASC');

            const departmentsWithSpecialists = await Promise.all(departments.map(async (department) => {
                const [workers] = await sequelize.query(
                    'SELECT id, surname, name, secondname, speciality FROM Specialists WHERE departmentId = :departmentId',
                    { replacements: { departmentId: department.id } }
                );

                const specialistsWithSchedules = await Promise.all(workers.map(async (worker) => {
                    const [schedule] = await sequelize.query(
                        'SELECT weekdays, startTime, endTime FROM SpecialistSchedules WHERE specialistId = :specialistId',
                        { replacements: { specialistId: worker.id } }
                    );
                    return {
                        ...worker,
                        schedule: schedule.length > 0 ? schedule[0] : null,
                    };
                }));

                return {
                    ...department,
                    workers: specialistsWithSchedules,
                };
            }));

            return res.json(departmentsWithSpecialists);
        } catch (error) {
            console.error('Ошибка при получении отделений:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getByID(req, res) {
        const { id } = req.params;
        console.log('Fetching department for ID lol:', id);

        try {
            const [departments] = await sequelize.query(
                'SELECT * FROM Departments WHERE id = :id',
                { replacements: { id } }
            );

            if (departments.length === 0) {
                console.log('Department not found for ID:', id);
                return res.status(404).json({ error: 'Отделение не найдено' });
            }
            const department = departments[0];

            console.log('Department found:', department);

            const [workers] = await sequelize.query(
                'SELECT id, surname, name, secondname, speciality FROM Specialists WHERE departmentId = :departmentId',
                { replacements: { departmentId: id } }
            );

            console.log('Workers found:', workers);

            const specialistsWithSchedules = await Promise.all(workers.map(async (worker) => {
                const [schedule] = await sequelize.query(
                    'SELECT weekdays, startTime, endTime FROM SpecialistSchedules WHERE specialistId = :specialistId',
                    { replacements: { specialistId: worker.id } }
                );
                return {
                    ...worker,
                    schedule: schedule.length > 0 ? schedule[0] : null,
                };
            }));

            return res.json({
                id: department.id,
                name: department.name,
                workers: specialistsWithSchedules,
            });

        } catch (error) {
            console.error('Ошибка при получении отделения по ID:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
};

module.exports = new DepartmentController(); 