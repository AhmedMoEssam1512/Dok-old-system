const sequelize = require('../config/database');
const { Op } = require("sequelize");
const Quiz = require('../models/quiz_model');
const Admin = require('../models/admin_model');
const Submission = require('../models/submission_model');

Quiz.belongsTo(Admin, { foreignKey: "publisher" });


function createQuiz(mark,publisher,quizPdf,date,semester,durationInMin,topicId, title){
    return Quiz.create({mark,publisher,quizPdf,date,semester,durationInMin, topicId, title, createdAt: Date.now()});
}; // nice comment

function getAllQuizzes(){
    return Quiz.findAll({attributes : {include: [
        ['quizId', 'id'],
    ]}, order: [['quizId', 'DESC']]});
};

async function getAllQuizzesForGroup(group) {
  return await Quiz.findAll({
    include: [
      {
        model: Admin,
        attributes: ["group"],
        where: {
          [Op.or]: [
            { group: group },
            { group: "all" }
          ]
        }
      }
    ],
    attributes: {include : [['quizId', 'id']] },
    order: [['quizId', 'DESC']]
  });
}

function getQuizById(quizId) {
    return Quiz.findByPk(quizId, {
        attributes: {
            include: [['quizId', 'id']] // adds 'id' (aliased from 'quizId') alongside all original fields
        }
    });
}
function updateQuizDates(quizId, newDate) {
    return Quiz.update({ startDate: newDate }, { where: { quizId } });
}

function createSubmission(quizId, studentId,assistantId ,answers, semester) {
    return Submission.create({ quizId, studentId,assistantId ,answers, semester, type : "quiz" });
}

function findSubmissionByQuizAndStudent(quizId,studentId){
    return Submission.findOne({where :{quizId,studentId,type:"quiz"}, order: [['subDate', 'DESC']]});
}

async function getQuizzesByTopicId(topicId) {
    return await Quiz.findAll({
    where: { topicId },
    attributes: ['quizId',['quizId', 'id'], 'title', 'mark'], order: [['quizId','DESC']] // only return id and name
  });
}

function findQuizAndDelete(quizId) {
    return Quiz.destroy({ where: { quizId } });
}


module.exports = {
     createQuiz,
    getAllQuizzes,
    getAllQuizzesForGroup,
    getQuizById,
    updateQuizDates,
    createSubmission,
    findSubmissionByQuizAndStudent,
    getQuizzesByTopicId,
    findQuizAndDelete
};