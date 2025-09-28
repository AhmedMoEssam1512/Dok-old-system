const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const Session = sequelize.define('Session', {
  sessionId: { type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true  },
  number: DataTypes.INTEGER,
  semester: DataTypes.STRING,
  dateAndTime: DataTypes.DATE,
  adminId: DataTypes.INTEGER,
  link: DataTypes.STRING
}, { tableName: 'session', timestamps: false });

module.exports = Session;
