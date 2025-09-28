const { Op } = require('sequelize');
const Student = require('../models/student_model');
const Assignment = require('../models/assignment_model');
const Quiz = require('../models/quiz_model');
const Submission = require('../models/submission_model');
const Topic = require('../models/topic_model');

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
    const { topicId } = req.params;

    // 🔒 Authorization: Only assistants allowed
    if (!req.admin || req.admin.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Assistants only.' });
    }
    const assistantId = req.admin.id;

    // 🔍 Validate topic exists and is owned by this assistant
    const topic = await Topic.findOne({
      where: { topicId: parseInt(topicId, 10), publisher: assistantId }
    });

    if (!topic) {
      return res.status(404).json({
        error: 'Topic not found or not owned by this assistant.'
      });
    }

    // 👥 Get all students assigned to this assistant
    const students = await Student.findAll({
      where: { assistantId: String(assistantId) }, // your model uses STRING
      attributes: ['studentId', 'studentName', 'totalScore']
    });

    // 📝 Fetch all assignments and quizzes for this topic
    const [assignments, quizzes] = await Promise.all([
      Assignment.findAll({
        where: { topicId: topic.topicId },
        attributes: ['assignId', 'title', 'mark']
      }),
      Quiz.findAll({
        where: { topicId: topic.topicId },
        attributes: ['quizId', 'title', 'mark']
      })
    ]);

    const studentIds = students.map(s => s.studentId);
    const assignmentIds = assignments.map(a => a.assignId);
    const quizIds = quizzes.map(q => q.quizId);

    // 📤 Fetch all relevant submissions
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

    // 🗂️ Group submissions by student for fast lookup
    const submissionsMap = {};
    submissions.forEach(sub => {
      const key = `${sub.studentId}-${sub.type}-${sub.type === 'assignment' ? sub.assId : sub.quizId}`;
      submissionsMap[key] = sub.score;
    });

    const grading = getGradingSystem();

    // 👨‍🎓 Build student reports
    const studentReports = students.map(student => {
      // Process assignments
      const assignmentResults = assignments.map(ass => {
        const score = submissionsMap[`${student.studentId}-assignment-${ass.assignId}`] ?? null;
        const maxMark = ass.mark || 0;
        const percentage = (score !== null && maxMark > 0) ? (score / maxMark) * 100 : 0;
        return {
          type: 'assignment',
          id: ass.assignId,
          title: ass.title,
          maxMark: maxMark,
          score: score,
          percentage: parseFloat(percentage.toFixed(2)),
          grade: grading.calculateGrade(percentage)
        };
      });

      // Process quizzes
      const quizResults = quizzes.map(quiz => {
        const score = submissionsMap[`${student.studentId}-quiz-${quiz.quizId}`] ?? null;
        const maxMark = quiz.mark || 0;
        const percentage = (score !== null && maxMark > 0) ? (score / maxMark) * 100 : 0;
        return {
          type: 'quiz',
          id: quiz.quizId,
          title: quiz.title,
          maxMark: maxMark,
          score: score,
          percentage: parseFloat(percentage.toFixed(2)),
          grade: grading.calculateGrade(percentage)
        };
      });

      return {
        studentName: student.studentName,
        totalScore: student.totalScore,
        detailedScores: [...assignmentResults, ...quizResults]
      };
    });

    // 📤 Final response structure
    const response = {
      topicId: topic.topicId,
      topicName: topic.topicName,
      semester: topic.semester,
      publisher: assistantId,
      role: 'assistant',
      students: studentReports
    };

    return res.json(response);

  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
};

module.exports = {createReport};