const sequelize = require('../config/database');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const Quiz = require('../models/quiz_model.js');
const quiz = require('../data_link/quiz_data_link.js');
const admin = require('../data_link/admin_data_link.js');
const student = require('../data_link/student_data_link.js');
const Admin = require('../models/admin_model.js');
const Student = require('../models/student_model.js');
const sse = require('../utils/sseClients.js');
const { getCache } = require("../utils/cache");
const { setCache } = require("../utils/cache");
const { Op } = require("sequelize");

const createQuiz = asyncWrapper(async (req, res) => {
    const {mark,quizPdf,date,semester,durationInMin, topicId} = req.body;
    const publisher = req.admin.id; 
    console.log("publisher id:", publisher)
    console.log("Creating quiz with data:", {mark,quizPdf,date,semester,durationInMin});
    const newQuiz = await quiz.createQuiz(mark,publisher,quizPdf,date,semester,durationInMin, topicId);  
    return res.status(201).json({
        status: "success" ,
        data: { message: "Quiz created successfully", quizId: newQuiz.quizId }
    });
});


const getAllQuizzes = asyncWrapper(async (req, res) => {
    const group = req.user.group;

    // Get all quizzes based on group
    const quizzes = group === 'all'
        ? await quiz.getAllQuizzes()
        : await quiz.getAllQuizzesForGroup(group);

    // Filter only quizzes that have already passed
    const now = new Date();
    const passedQuizzes = quizzes.filter(q => new Date(q.date) < now);

    return res.status(200).json({
        status: "success",
        results: passedQuizzes.length,
        data: { quizzes: passedQuizzes }
    })
});

const getQuizById = asyncWrapper(async (req, res, next) => {
    const quizData = req.quizData;
    return res.status(200).json({
        status: "success",
        data: { quizData }
    });
});

const startQuiz = asyncWrapper(async (req, res, next) => {
    const { quizId } = req.params;
    const adminGroup = req.admin.group;

    // update quiz date to now
    await quiz.updateQuizDates(quizId, new Date());

    const quizData = await quiz.getQuizById(quizId);

    // cache key based on group
    const cacheKey = `activeQuiz:${adminGroup}`;

    // store quiz in cache
    setCache(cacheKey, quizData, (quizData.durationInMin * 60) + 600);

    sse.notifyStudents(adminGroup, {
        event: "Quiz is starting",
        message: `Quiz to group ${adminGroup} is gonna start now. Please check your dashboard.`,
        
      });

    return res.status(200).json({
        status: "success",
        data: { 
            message: `Quiz started for group ${adminGroup} and cached`, 
            quiz: quizData 
        }
    });
});



const getActiveQuiz = asyncWrapper(async (req, res, next) => {
    const activeQuiz = req.quizData;
    return res.status(200).json({
        status: "success",
        data: { activeQuiz }
    });
});


const submitActiveQuiz = asyncWrapper(async (req, res, next) => {
    const { answers } = req.body;
    const studentId = req.user.id;
    const found = await student.findStudentById(studentId);
    const activeQuiz = req.quizData;
    const newSub= await quiz.createSubmission(activeQuiz.quizId, studentId,found.assistantId ,answers, found.semester);

    return res.status(200).json({
        status: "success",
        data: { message: "Quiz submitted successfully" ,
        submissionId: newSub.id  
        }
    });
});

const submitQuiz = asyncWrapper(async (req, res, next) => {
    const { answers } = req.body;
    const studentId = req.user.id;
    const found = await student.findStudentById(studentId);
    const {quizId} = req.params;
    const newSub= await quiz.createSubmission(quizId, studentId,found.assistantId ,answers, found.semester);

    return res.status(200).json({
        status: "success",
        data: { message: "Quiz submitted successfully" ,
        submissionId: newSub.id  
        }
    });
});


// get by topic id

module.exports = {
    createQuiz  ,
    getAllQuizzes,
    getQuizById, 
    startQuiz,
    getActiveQuiz,
    submitActiveQuiz,
    submitQuiz
};