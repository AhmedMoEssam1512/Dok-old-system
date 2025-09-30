const { Op } = require('sequelize');
const Student = require('../models/student_model');
const student = require('../data_link/student_data_link.js');
const Assignment = require('../models/assignment_model');
const assignment = require('../data_link/assignment_data_link.js');
const Quiz = require('../models/quiz_model');
const quiz = require('../data_link/quiz_data_link.js');
const Submission = require('../models/submission_model');
const submission = require('../data_link/submission_data_link.js');
const Topic = require('../models/topic_model');
const topicDl = require('../data_link/topic_data_link.js');
const {sanitizeInput}= require('../utils/sanitize.js');

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
  try {
    sanitizeInput(req.params);
    const { topicId } = req.params;

    // 🔒 Authorization: EXACTLY as requested
    if (!req.admin || req.admin.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Assistants only.' });
    }

    // We assume req.admin.id is the assistant's ID (publisher)
    const assistantId = req.admin.id;

    // 🔍 Validate topic exists and belongs to this assistant
    const topic = await topicDl.getTopicByAssistantId(topicId,assistantId);

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found or not owned by this assistant.'
      });
    }

    if (topic.group !== req.admin.group) {
      return res.status(403).json({ error: 'You are not authorized to access this topic.' });
    }  

    // 👥 Get all students assigned to this assistant
    // Note: your Student.assistantId is STRING, so convert assistantId to string
    const students = await student.getStudentsByAssistant(assistantId);

    // 📝 Fetch all assignments and quizzes for this topic
    const [assignments, quizzes] = await Promise.all([
      Assignment.findAll({
        where: { topicId: topic.topicId },
        attributes: [['assignId', 'id'], 'title', 'mark']
      }),
      Quiz.findAll({
        where: { topicId: topic.topicId },
        attributes: [['quizId','id'], 'title', 'mark']
      })
    ]);

    const studentIds = students.map(s => s.studentId);
    const assignmentIds = assignments.map(a => a.assignId);
    const quizIds = quizzes.map(q => q.quizId);

    // 📤 Build submission query conditions
    let submissionConditions = [];
    if (assignmentIds.length > 0) {
      submissionConditions.push({
        type: 'assignment',
        assId: { [Op.in]: assignmentIds },
        studentId: { [Op.in]: studentIds }
      });
    }
    if (quizIds.length > 0) {
      submissionConditions.push({
        type: 'quiz',
        quizId: { [Op.in]: quizIds },
        studentId: { [Op.in]: studentIds }
      });
    }

    let submissions = [];
    if (submissionConditions.length > 0) {
      submissions = await Submission.findAll({
        where: { [Op.or]: submissionConditions },
        attributes: ['studentId', 'type', 'assId', 'quizId', 'score']
      });
    }

    // 🗂️ Create a lookup map for O(1) access
    const submissionsMap = {};
    submissions.forEach(sub => {
      const key = `${sub.studentId}-${sub.type}-${sub.type === 'assignment' ? sub.assId : sub.quizId}`;
      submissionsMap[key] = sub.score; // may be number, null, or undefined
    });

    const grading = getGradingSystem();

    // 👨‍🎓 Generate report for each student
    const studentReports = students.map(student => {
      // Process assignments
      const assignmentResults = assignments.map(ass => {
        const rawScore = submissionsMap[`${student.studentId}-assignment-${ass.assignId}`];
        const maxMark = ass.mark || 0;

        const displayedScore = (rawScore === null || rawScore === undefined)
          ? "unmarked"
          : rawScore;

        const percentage = (rawScore !== null && rawScore !== undefined && maxMark > 0)
          ? parseFloat(((rawScore / maxMark) * 100).toFixed(2))
          : 0;

        return {
          type: 'assignment',
          id: ass.assignId,
          title: ass.title,
          maxMark: maxMark,
          score: displayedScore,
          percentage: percentage,
          grade: grading.calculateGrade(percentage)
        };
      });

      // Process quizzes
      const quizResults = quizzes.map(quiz => {
        const rawScore = submissionsMap[`${student.studentId}-quiz-${quiz.quizId}`];
        const maxMark = quiz.mark || 0;

        const displayedScore = (rawScore === null || rawScore === undefined)
          ? "unmarked"
          : rawScore;

        const percentage = (rawScore !== null && rawScore !== undefined && maxMark > 0)
          ? parseFloat(((rawScore / maxMark) * 100).toFixed(2))
          : 0;

        return {
          type: 'quiz',
          id: quiz.quizId,
          title: quiz.title,
          maxMark: maxMark,
          score: displayedScore,
          percentage: percentage,
          grade: grading.calculateGrade(percentage)
        };
      });

      return {
        studentName: student.studentName,
        totalScore: student.totalScore,
        detailedScores: [...assignmentResults, ...quizResults]
      };
    });

    // 📤 Final response: topic first, then students
    return res.json({
      id: topic.topicId,
      topicName: topic.topicName,
      semester: topic.semester,
      publisher: assistantId,
      role: 'assistant',
      students: studentReports
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
};

module.exports = {createReport};