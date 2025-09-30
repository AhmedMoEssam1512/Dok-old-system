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
const submission = require('../data_link/submission_data_link.js');
const Assignment = require('../models/assignment_model');
const assignment = require('../data_link/assignment_data_link.js');
const Quiz = require('../models/quiz_model.js');
const quiz = require('../data_link/quiz_data_link.js');
const Topic = require('../models/topic_model');
const topicDl = require('../data_link/topic_data_link.js');
const { sanitizeInput } = require('../utils/sanitize.js');

// Helper: normalize null/undefined values to "N/A"
const normalize = (value) => (value === null || value === undefined ? "N/A" : value);

// Helper function to get student submission for assignment
const getStudentSubmissionForAssignment = async (studentId, assignmentId) => {
  return await submission.getSubmissionForAssignment(studentId,assignmentId);
};

// Helper function to get student submission for quiz
const getStudentSubmissionForQuiz = async (studentId, quizId) => {
  return submission.getSubmissionForQuiz(studentId,quizId);
};

const getMyWeeklyReport = asyncWrapper(async (req, res) => {
  sanitizeInput(req.params);
  const { topicId } = req.params;
  const studentId = req.student.id;

  try {
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
    if(topicId === 'last') {
      topic = await topicDl.getStudentLastTopic();
    }
    if (topicId) {
      topic = await topicDl.getTopicById(topicId);
      if (!topic) {
        return res.status(404).json({
          status: "error",
          message: "Topic not found"
        });
      }
      if (topic.group !== studentData.group) {
        return res.status(403).json({
          status: "error",
          message: "You are not authorized to access this topic"
        });
      }

    } else {
      return res.status(400).json({
        status: "error",
        message: "Topic ID is required"
      });
    }
    

    
    // Get assignments in this topic
    const assignments = await assignment.getAssignmentsByTopicId(topic.topicId);

    // Get quizzes in this topic
    const quizzes = await quiz.getQuizzesByTopicId(topic.topicId);

    // Create report data
    const reportData = {
      id:topic.topicId,
      topicTitle: topic.topicName, // adjust if it's actually "title" in your DB
      studentName: studentData.studentName,
      semester: topic.semester,
      materials: []
    };

    const now = new Date();

    // Process assignments
    for (let index = 0; index < assignments.length; index++) {
      const assignment = assignments[index];
      const submission = await getStudentSubmissionForAssignment(studentId, assignment.assignId);

      let status = "Missing";
      if (submission) {
        if (submission.marked === "yes") {
          status = "Marked";
        } else {
          status = "Submitted (Pending Review)";
        }
      } else {
        if (assignment.endDate && new Date(assignment.endDate) > now) {
          status = "Unsubmitted (Still Open)";
        }
      }

      const assignmentData = {
        type: 'assignment',
        id: assignment.assignId,
        columnName: `Hw${index + 1}`,
        title: assignment.title,
        maxPoints: assignment.mark, // your Assignment model uses "mark"
        status,
        score: submission ? normalize(submission.score) : "N/A",
        feedback: submission ? normalize(submission.feedback) : "N/A"
      };

      reportData.materials.push(assignmentData);
    }

    // Process quizzes
    for (let index = 0; index < quizzes.length; index++) {
      const quiz = quizzes[index];
      const submission = await getStudentSubmissionForQuiz(studentId, quiz.quizId);

      let percentage = "N/A";
      let grade = "N/A";
      let status = "Missing";

      if (submission) {
        if (submission.marked === "yes") {
          status = "Marked";
        } else {
          status = "Submitted (Pending Review)";
        }

        if (submission.score !== null && submission.score !== undefined) {
          percentage = (submission.score / quiz.mark) * 100;

          if (percentage >= 80) grade = 'A*';
          else if (percentage >= 70) grade = 'A';
          else if (percentage >= 60) grade = 'B';
          else if (percentage >= 50) grade = 'C';
          else grade = 'U';
        }
      } else {
        if (quiz.endDate && new Date(quiz.endDate) > now) {
          status = "Unsubmitted (Still Open)";
        }
      }

      const quizData = {
        type: 'quiz',
        id: quiz.quizId,
        columnName: `Quiz${index + 1}`,
        title: quiz.title,
        maxPoints: quiz.mark,
        status,
        score: submission ? normalize(submission.score) : "N/A",
        percentage: normalize(percentage),
        grade: normalize(grade),
        feedback: submission ? normalize(submission.feedback) : "N/A"
      };

      reportData.materials.push(quizData);
    }

    return res.status(200).json({
      status: "success",
      message: "Weekly report generated successfully",
      data: reportData
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
});

module.exports = {
  getMyWeeklyReport
};

