require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const sequelize = require('./db');
const models = require('./models/models');
const cors = require('cors');
const router = require('./routes/index');
const errorHandler = require('../server/middleware/ErrorHandlingMiddleware');
const path = require('path');
const PORT = process.env.PORT || 5000;

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/api', router);
app.use(errorHandler);

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
    } catch (e) {
        console.log(e);
    }
};
start();
