const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const Quiz = sequelize.define('Quiz', {
  quizId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: DataTypes.STRING,
  mark: DataTypes.INTEGER,
  createdAt : DataTypes.DATE,
  publisher: DataTypes.INTEGER,
  quizPdf: DataTypes.STRING,
  startDate: DataTypes.DATE,
  semester: DataTypes.STRING,
  durationInMin: DataTypes.INTEGER,
  topicId: DataTypes.INTEGER
}, { tableName: 'quiz', timestamps: false });

module.exports = Quiz;
