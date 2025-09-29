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

// Helper: normalize null/undefined values to "N/A"
const normalize = (value) => (value === null || value === undefined ? "N/A" : value);

// Helper function to get student submission for assignment
const getStudentSubmissionForAssignment = async (studentId, assignmentId) => {
  return await Submission.findOne({
    where: {
      studentId,
      assId: assignmentId,
      type: 'assignment'
    }
  });
};

// Helper function to get student submission for quiz
const getStudentSubmissionForQuiz = async (studentId, quizId) => {
  return await Submission.findOne({
    where: {
      studentId,
      quizId,
      type: 'quiz'
    }
  });
};

const getMyWeeklyReport = asyncWrapper(async (req, res) => {
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
    if (topicId) {
      topic = await Topic.findOne({
        where: { topicId }
      });
    } else {
      topic = await Topic.findOne({
        order: [['createdAt', 'DESC']]
      });
    }

    if (!topic) {
      return res.status(404).json({
        status: "error",
        message: "Topic not found"
      });
    }

    // Get assignments in this topic
    const assignments = await Assignment.findAll({
      where: { topicId: topic.topicId },
      order: [['startDate', 'DESC']]
    });

    // Get quizzes in this topic
    const quizzes = await Quiz.findAll({
      where: { topicId: topic.topicId },
      order: [['createdAt', 'DESC']]
    });

    // Create report data
    const reportData = {
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

