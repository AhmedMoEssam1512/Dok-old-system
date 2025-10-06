const { Op } = require('sequelize');
const Student = require('../models/student_model');
const student = require('../data_link/student_data_link.js');
const Assignment = require('../models/assignment_model');
const Quiz = require('../models/quiz_model');
const Submission = require('../models/submission_model');
const Topic = require('../models/topic_model');
const topicDl = require('../data_link/topic_data_link.js');
const { sanitizeInput } = require('../utils/sanitize.js');
const Session = require('../models/session_model');
const Attendance = require('../models/attendance_model');
const sessionDl= require('../data_link/session_data_link.js');

const getGradingSystem = () => {
  return {
    calculateGrade: (percentage) => {
      if (percentage >= 80) return 'A*';
      if (percentage >= 70) return 'A';
      if (percentage >= 60) return 'B';
      if (percentage >= 50) return 'C';
      return 'U';
    }
  };
};

const createReport = async (req, res) => {
  //try {
    sanitizeInput(req.params);
    const { topicId } = req.params;

    // 🔒 Authorization
    if (!req.admin || req.admin.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Assistants only.' });
    }

    const assistantId = req.admin.id;

    // 🔍 Validate topic exists and belongs to this assistant
    const topic = await topicDl.getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found or not owned by this assistant.'
      });
    }
    if (topic.group !== req.admin.group) {
      return res.status(403).json({ error: 'You are not authorized to access this topic.' });
    }
    console.log("Topic found");

    // 👥 Get all students assigned to this assistant
    const students = await student.getStudentsByAssistant(assistantId);
    // Fetch assignments WITH title
    const assignments = await Assignment.findAll({
      where: { topicId: topic.topicId },
      attributes: ['assignId', 'title', 'mark'] // ✅ ADDED 'title'
    });
    console.log("Assignments found:", assignments.length);
    const quizzes = await Quiz.findOne({
      where: { topicId: topic.topicId },
      attributes: ['quizId', 'mark','title']
    });
    console.log("Quiz found:", quizzes ? quizzes.title : 'None');
    // ✅ Use 0 instead of null
    const quizTotalScore = quizzes?.mark ?? 0;
    const numberOfAssignments = assignments.length;
    const quizTitle = quizzes?.title ?? 'N/A';

    const studentIds = students.map(s => s.studentId);
    console.log("Student IDs:", studentIds.length);  
    // if (studentIds.length === 0) {
    //   return res.status(400).json({
    //     status: "Error",
    //     message: "No students assigned to this assistant this semester"
    // });}

    // 📤 Build submission query conditions
    let submissionConditions = [];
    const assignmentIds = assignments.map(a => a.assignId);
    if (assignmentIds.length > 0) {
      submissionConditions.push({
        type: 'assignment',
        assId: { [Op.in]: assignmentIds },
        studentId: { [Op.in]: studentIds }
      });
    }
    console.log("Assignment submission condition:", submissionConditions.length); 
    if (quizzes) {
      submissionConditions.push({
        type: 'quiz',
        quizId: quizzes.quizId,
        studentId: { [Op.in]: studentIds }
      });
    }
    console.log("Quiz submission condition:", submissionConditions.length);

    let submissions = [];
     if (submissionConditions.length > 0) {
      submissions = await Submission.findAll({
        where: { [Op.or]: submissionConditions },
        attributes: ['studentId', 'type', 'assId', 'quizId', 'score']
      });
    }
    console.log("Submissions found:", submissions.length);  

    // 🗂️ Create a lookup map for O(1) access
    const submissionsMap = {};  submissions.forEach(sub => {
      if (sub.type === 'assignment') {
        submissionsMap[`A-${sub.studentId}-${sub.assId}`] = sub.score;
      } else if (sub.type === 'quiz') {
        submissionsMap[`Q-${sub.studentId}`] = sub.score; // only one quiz
      }
    });
    console.log("Submissions map size:", Object.keys(submissionsMap).length);

    const grading = getGradingSystem();
    console.log("Grading system ready");
    // 👨‍🎓 Generate report for each student
    const studentReports = students.map(st => {
      console.log("Processing student:", st.studentId);
      // 🔹 Quiz data
      const quizScore = submissionsMap[`Q-${st.studentId}`];
      let percentage = 'N/A';
      let grade = 'N/A';
      if (quizScore != null && quizTotalScore > 0) {
        percentage = parseFloat(((quizScore / quizTotalScore) * 100).toFixed(2));
        grade = grading.calculateGrade(percentage);
      }
      console.log("quiz grade added for each student");
      // 🔹 Assignment summary: count submitted
      const assignmentList = assignments.map(ass => ({
        id: ass.assignId,
        title: ass.title,
        status: submissionsMap[`A-${st.studentId}-${ass?.assignId}`] != null 
        ? "done" 
        : "missing"
      }));

      return {
        id: st.studentId,
        email: st.studentEmail,
        studentName: st.studentName,
        banned: st.banned,
        quizScore: quizScore ?? 'N/A',
        percentage,
        grade,
        assignments: assignmentList // e.g., "2/3"
      };
    });
    console.log("report done")
    
    // 📤 Final response
      return res.status(200).json({
      status: "success",
      message : "report ready",
      data : {
        topicId: topic.topicId,
        topicName: topic.topicName,
        quizTitle,
        quizTotalScore ,
        numberOfAssignments,
        students: studentReports
      }
        
    });

  // } catch (error) {
  //   console.error('Report generation error:', error);
  //   return res.status(500).json({ error: 'Failed to generate report.' });
  // }
};

module.exports = { createReport };
