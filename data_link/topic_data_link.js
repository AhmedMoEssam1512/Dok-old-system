const sequelize = require('../config/database');
const { Op } = require("sequelize");
const Admin = require('../models/admin_model');
const Topic = require('../models/topic_model');

function createTopic(topicName, semester, publisher,subject) {
    return Topic.create({ topicName, semester, publisher, subject});
}

function getTopicById(topicId) {
    return Topic.findOne({ where: { topicId } });
}

async function getAllTopicsByGroup(group) {
    return await Topic.findAll({ where: { publisher: { [Op.in]: sequelize.literal(`(SELECT id FROM admin WHERE \`group\` = '${group}')`) } } });
}

function getAllTopics() {
    return Topic.findAll();
}

module.exports = {
    createTopic,
    getTopicById,
    getAllTopicsByGroup,
    getAllTopics
};