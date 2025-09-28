const sequelize = require('../config/database');
const Admin = require('../models/admin_model');
const Student = require('../models/student_model');
const asyncWrapper = require('../middleware/asyncwrapper');
const Material = require('../models/material_model');
const Topic = require('../models/topic_model');
const { Op } = require("sequelize");

function createMaterial (title, description, document, topicId, publisher, uploadDate) {
    return Material.create({title, description, document, topicId, publisher, uploadDate});
} 

module.exports = {
    createMaterial
};