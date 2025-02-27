const sequelize = require('../db');
const { DataTypes } = require('sequelize');

//специалист
const Specialist = sequelize.define('specialist', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    surname: { type: DataTypes.CHAR(100) },
    name: { type: DataTypes.CHAR(100) },
    secondname: { type: DataTypes.CHAR(100) },
    speciality: { type: DataTypes.CHAR(100) },
    cabinet: { type: DataTypes.INTEGER }
}, {
    timestamps: false
});

const SpecialistEnter = sequelize.define('specialistenter', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    password: { type: DataTypes.CHAR(10), unique: true }
}, {
    timestamps: false
});

const SpecialistPersonalInfo = sequelize.define('specialistpersonalinfo', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    phonenumber: { type: DataTypes.CHAR(13) },
    adress: { type: DataTypes.CHAR(100) },
    birthdate: { type: DataTypes.DATEONLY }
}, {
    timestamps: false
});

const SpecialistSchedule = sequelize.define('specialistschedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    weekdays: { type: DataTypes.CHAR(100) },
    starttime: { type: DataTypes.TIME },
    endtime: { type: DataTypes.TIME }
}, {
    timestamps: false
});

//пациент
const Patient = sequelize.define('patient', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    surname: { type: DataTypes.CHAR(100) },
    name: { type: DataTypes.CHAR(100) },
    secondname: { type: DataTypes.CHAR(100) },
    gender: { type: DataTypes.ENUM('M', 'F') },
    birthdate: { type: DataTypes.DATEONLY },
    phonenumber: { type: DataTypes.CHAR(13) },
    adress: { type: DataTypes.CHAR(100) }
}, {
    timestamps: false
});

const PatientEnter = sequelize.define('patiententer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    password: { type: DataTypes.CHAR(10), unique: true },
    gmail: { type: DataTypes.CHAR(100) }
}, {
    timestamps: false
});

//мед карточка
const MedicalRecord = sequelize.define('medicalrecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
}, {
    timestamps: false
});

const MedicalRecordAppointments = sequelize.define('medicalrecordappointments', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
}, {
    timestamps: false
});

//отдел
const Department = sequelize.define('department', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.CHAR(100), unique: true }
}, {
    timestamps: false
});

//талон
const Appointment = sequelize.define('appointment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    date: { type: DataTypes.DATE },
    time: { type: DataTypes.TIME },
    status: { type: DataTypes.ENUM('active', 'canceled') }
}, {
    timestamps: false
});

//админ
const Admin = sequelize.define('admin', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.CHAR(100) },
    password: { type: DataTypes.CHAR(10), unique: true }
}, {
    timestamps: false
});

const AdminActivity = sequelize.define('adminactivity', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    activity: { type: DataTypes.ENUM('updated', 'deleted', 'created') },
    tablename: { type: DataTypes.CHAR(100) },
    idfromtable: { type: DataTypes.INTEGER },
    fieldname: { type: DataTypes.CHAR(100) },
    fieldbefore: { type: DataTypes.CHAR(100) },
    fieldafter: { type: DataTypes.CHAR(100) }
}, {
    timestamps: false
});

Admin.hasMany(AdminActivity);
AdminActivity.belongsTo(Admin);

Specialist.belongsTo(Department);
Department.hasMany(Specialist);

Specialist.hasOne(SpecialistEnter);
SpecialistEnter.belongsTo(Specialist);

Specialist.hasOne(SpecialistPersonalInfo);
SpecialistPersonalInfo.belongsTo(Specialist);

Specialist.hasOne(SpecialistSchedule);
SpecialistSchedule.belongsTo(Specialist);

Specialist.hasMany(Appointment);
Appointment.belongsTo(Specialist);

Patient.hasOne(PatientEnter);
PatientEnter.belongsTo(Patient);

Patient.hasOne(MedicalRecord);
MedicalRecord.belongsTo(Patient);

Patient.hasMany(Appointment);
Appointment.belongsTo(Patient);

Appointment.belongsTo(Specialist);
Specialist.hasMany(Appointment);

MedicalRecord.hasMany(MedicalRecordAppointments);
MedicalRecordAppointments.belongsTo(MedicalRecord);

Appointment.hasOne(MedicalRecordAppointments);
MedicalRecordAppointments.belongsTo(Appointment);

module.exports = {
    Specialist,
    SpecialistEnter,
    SpecialistPersonalInfo,
    SpecialistSchedule,
    Patient,
    PatientEnter,
    MedicalRecordAppointments,
    MedicalRecord,
    Department,
    Appointment,
    Admin,
    AdminActivity
};