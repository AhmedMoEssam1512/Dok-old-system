const sequelize = require('../config/database');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const Quiz = require('../models/quiz_model.js');
const quiz = require('../data_link/quiz_data_link.js');
const admin = require('../data_link/admin_data_link.js');
const student = require('../data_link/student_data_link.js');
const assignment = require('../data_link/assignment_data_link.js');
const Admin = require('../models/admin_model.js');
const Student = require('../models/student_model.js');
const Topic = require('../models/topic_model.js');
const topic = require('../data_link/topic_data_link.js');
const { Op } = require("sequelize");

const createTopic = asyncWrapper(async (req, res) => {
    const { topicName, topicStartDate, topicEndDate, semester, subject } = req.body;
    const publisher = req.admin.id;
    console.log("publisher id:", publisher)
    console.log("Creating topic with data:", { topicName, topicStartDate, topicEndDate, semester, subject });
    const newTopic = await topic.createTopic( topicName, topicStartDate, topicEndDate, semester, publisher, subject );
    return res.status(201).json({
        status: "success",
       message: "Topic created successfully",
        data: {  topicId: newTopic.topicId,
                 topicName: newTopic.topicName,
                 subject: newTopic.subject,
                 semester: newTopic.semester,
         }
        
    });
});

const getTopicById = asyncWrapper(async (req, res, next) => {
    const { topicId } = req.params;
    const topicFound = await topic.getTopicById(topicId );
    const quizzes = (await quiz.getQuizzesByTopicId(topicId))
  .map(q => {
    const plain = q.get({ plain: true });
    return { ...plain, type: 'quiz' };
  });

    const assignments = (await assignment.getAssignmentsByTopicId(topicId))
  .map(a => {
    const plain = a.get({ plain: true }); // turn Sequelize model into plain object
    return { ...plain, type: 'pdf' };     // add new field
  });

    return res.status(200).json({
        status: "success",
        data: {id :topicId,
            topicName: topicFound.topicName,
            subject: topicFound.subject,
            semester: topicFound.semester,
            quizzes: quizzes,
            assignments: assignments 
        }    
    })
});

module.exports = {
    createTopic,
};