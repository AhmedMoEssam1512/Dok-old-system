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
    const { topicName, semester, subject } = req.body;
    const publisher = req.admin.id;
    const group = req.admin.group;
    console.log("publisher id:", publisher)
    console.log("Creating topic with data:", { topicName, semester, subject });
    const newTopic = await topic.createTopic( topicName, semester, publisher, subject );
    return res.status(201).json({
        status: "success",
       message: "Topic created successfully",
        data: {  topicId: newTopic.topicId,
                 topicName: newTopic.topicName,
                 subject: newTopic.subject,
                 semester: newTopic.semester,
                 group: group
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

const getAllTopics = asyncWrapper(async (req, res, next) => {
    const group = req.user.group;
    let topics = (req.user.type === 'admin' && req.user.id === 1) ? 
        await topic.getAllTopics() : null;

    if (!topics) {
        topics = await topic.getAllTopicsByGroup(group);
    }
    console.log("All topics for group", group, ":", topics);
    return res.status(200).json({
        status: "success",
        message: `Retrieved ${topics.length} topics for group ${group}`,
        data: {
            topics : topics
        }
    })
});

const updateTopic = asyncWrapper(async (req, res, next) => {
    const found = req.found;
    const { topicName, semester, subject } = req.body;
    found.topicName = topicName || found.topicName;
    found.semester = semester || found.semester;
    found.subject = subject || found.subject;
    await found.save();
    res.status(200).json({ status: "success", 
        message: `topic ${topicName} updated successfully `,
        data : { topicId: found.topicId,
                 topicName: found.topicName,
                 subject: found.subject,
                 semester: found.semester,
                 publisher: found.publisher,
                 group: req.admin.group
                 }
    });
});

const deleteTopic = asyncWrapper(async (req, res, next) => {
    // Implementation for deleting a topic would go here
    res.status(501).json({ status: "error", message: "Not implemented" });
});


module.exports = {
    createTopic,
    getTopicById,
    getAllTopics,
    updateTopic,
};