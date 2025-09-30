const sequelize = require('../config/database');
const { Op } = require("sequelize");
const Admin = require('../models/admin_model');
const Topic = require('../models/topic_model');
// wah
Topic.belongsTo(Admin, { foreignKey: 'publisher', as: 'publisherAdmin' });

function createTopic(topicName, semester, publisher,subject) {
    return Topic.create({ topicName, semester, publisher, subject});
}

function getTopicById(topicId) {
    return Topic.findOne({ where: { topicId } });
}

function getStudentLastTopic() {
    return Topic.findOne({where:{group: req.student.group},
        order: [['createdAt', 'DESC']]
    });
}

async function getAllTopicsByGroup(group) {
  return await Topic.findAll({
    include: [{
      model: Admin,
      as: "publisherAdmin",   // make sure you define the alias in associations
      where: { group: group },
      attributes: []          // don’t pull extra admin fields unless needed
    }]
  });
}


function getAllTopics() {
    return Topic.findAll();
}

module.exports = {
    createTopic,
    getTopicById,
    getAllTopicsByGroup,
    getAllTopics,
    getStudentLastTopic
};