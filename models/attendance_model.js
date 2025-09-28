const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const Attendance = sequelize.define('Attendance', {
  attId: { type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true  },
  studentId: DataTypes.STRING,
  recordedAt: DataTypes.DATE,
  semester: DataTypes.STRING,
  sessionId: DataTypes.STRING
}, { tableName: 'attendance', timestamps: false });

module.exports = Attendance;
