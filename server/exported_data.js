const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');

async function exportDatabaseToExcel() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1389root',
        database: 'Hospital'
    });
    const workbook = new ExcelJS.Workbook();
    try {
        const [tables] = await connection.query('SHOW TABLES');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            const worksheet = workbook.addWorksheet(tableName);
            if (rows.length > 0) {
                const headers = Object.keys(rows[0]);
                worksheet.addRow(headers);
                rows.forEach(row => {
                    worksheet.addRow(Object.values(row));
                });
            }
        }

        await workbook.xlsx.writeFile('exported_database.xlsx');
        console.log('База данных успешно экспортирована в exported_database.xlsx');
    } catch (error) {
        console.error('Ошибка при экспорте базы данных:', error);
    } finally {
        await connection.end();
    }
}

exportDatabaseToExcel();