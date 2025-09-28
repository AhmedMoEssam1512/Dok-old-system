const sequelize = require('../config/database');
const { Op } = require("sequelize");
const Admin = require('../models/admin_model');
const Topic = require('../models/topic_model');

function createTopic(topicName, semester, publisher, group) {
    return Topic.create({ topicName, semester, publisher, subject, group});
}

function getTopicById(topicId) {
    return Topic.findOne({ where: { topicId } });
}

module.exports = {
    createTopic,
    getTopicById
};