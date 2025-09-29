// ==================== GET MY WEEKLY REPORT FUNCTION ====================
const sequelize = require('../config/database');
const Student = require('../models/student_model.js');
const student = require('../data_link/student_data_link');
const admin = require('../data_link/admin_data_link.js');
const feed = require('../data_link/feed_data_link.js');
const bcrypt = require('bcrypt');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const jwt = require("jsonwebtoken");
const { notifyAssistants } = require('../utils/sseClients');
const Registration = require('../models/registration_model.js');
const Submission = require('../models/submission_model');
const Assignment = require('../models/assignment_model');
const Quiz = require('../models/quiz_model.js');
const Topic = require('../models/topic_model');


// Helper function to get student submission for assignment
const getStudentSubmissionForAssignment = async (studentId, assignmentId) => {
  return await Submission.findOne({
      where: {
          studentId: studentId,
          assId: assignmentId,
          type: 'assignment'
      }
  });
};

// Helper function to get student submission for quiz
const getStudentSubmissionForQuiz = async (studentId, quizId) => {
  return await Submission.findOne({
      where: {
          studentId: studentId,
          quizId: quizId,
          type: 'quiz'
      }
  });
};

const getMyWeeklyReport = asyncWrapper(async (req, res) => {
    const { topicId } = req.params;
    const studentId = req.student.id;
    

        // Get student data
        const studentData = await student.findStudentById(studentId);
        if (!studentData) {
            return res.status(404).json({
                status: "error",
                message: "Student not found"
            });
        }
        
        // Get topic details
        let topic;
        
        if (topicId) {
            // Get specific topic
            topic = await Topic.findOne({
                where: { topicId: topicId }
            });
        } else {
            // Get latest topic
            topic = await Topic.findOne({
                order: [['createdAt', 'DESC']]
            });
        }
        
        
        // Get assignments in this topic
        const assignments = await Assignment.findAll({
            where: { topicId : topic.topicId },
            order: [['startDate', 'DESC']]
        });
        
        // Get quizzes in this topic
        const quizzes = await Quiz.findAll({
            where: { topicId: topic.topicId },
            order: [['createdAt', 'DESC']]
        });
        
        // Create report data
        const reportData = {
            topicTitle: topic.title,
            studentName: studentData.studentName,
            semester: topic.semester,
            materials: []
        };
        
        // Process assignments
        for (let index = 0; index < assignments.length; index++) {
            const assignment = assignments[index];
            const submission = await getStudentSubmissionForAssignment(studentId, assignment.assignId);
            
            const assignmentData = {
                type: 'assignment',
                columnName: `Hw${index + 1}`,
                title: assignment.title,
                maxPoints: assignment.mark,
                status: (submission && submission.marked === 'yes') ? 'Done' : 'Missing',
                score: submission ? submission.score : "N/A",
                feedback: submission ? submission.feedback : "N/A"
            };
            
            reportData.materials.push(assignmentData);
        }
        
        // Process quizzes
        
        const quiz = await Quiz.findOne({ where: { topicId: topic.topicId } });
        const submission = await getStudentSubmissionForQuiz(studentId, quiz.quizId);     
        let percentage = 0;
        let grade = 'U'; 
        if (submission && submission.score !== 'N/A') {
            percentage = (submission.score / quiz.maxPoints) * 100;    
            if (percentage >= 80) {
                grade = 'A*';
            } else if (percentage >= 70) {
                grade = 'A';
            } else if (percentage >= 60) {
                grade = 'B';
            } else if (percentage >= 50) {
                grade = 'C';
            } else {
                grade = 'U';
            }
        }
            
        const quizData = {
            type: 'quiz',
            title: quiz.title,
            maxPoints: quiz.mark,
            score: submission ? submission.score : 'N/A',
            percentage: submission ? percentage : 'N/A',
            grade: submission ? grade : 'N/A',
            feedback: submission ? submission.feedback : 'N/A'
        };
        
        reportData.materials.push(quizData);
        
        
        return res.status(200).json({
            status: "success",
            message: "Weekly report generated successfully",
            data: reportData
        });
        
    } 
);

module.exports = {
    getMyWeeklyReport
};