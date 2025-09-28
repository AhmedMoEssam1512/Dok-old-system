const sequelize = require('../config/database');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const Quiz = require('../models/quiz_model.js');
const quiz = require('../data_link/quiz_data_link.js');
const admin = require('../data_link/admin_data_link.js');
const student = require('../data_link/student_data_link.js');
const assignment = require('../data_link/assignment_data_link.js');
const Admin = require('../models/admin_model.js');
const Student = require('../models/student_model.js');
const Topic = require('../models/topic_model.js');
const topic = require('../data_link/topic_data_link.js');
const Material = require('../models/material_model');
const material = require('../data_link/material_data_link');
const { Op } = require("sequelize");

const createMaterial = asyncWrapper(async (req, res, next) => {
    const {title, description, document, topicId} = req.body;
    const publisher = req.admin.id;
    const uploadDate = new Date();
    console.log("Creating material with data:", { title, description, document, topicId, publisher, uploadDate });
    const newMaterial = await material.createMaterial(title, description, document, topicId, publisher, uploadDate);
    return res.status(201).json({
        status: "success",
        message: "Material created successfully",
        data: {  newMaterial   }
    })
});

const getAllMaterials = asyncWrapper(async (req, res, next) => {
    const materials = await material.getAllMaterialsByGroup(req.user.group);
    return res.status(200).json({
        status: "success",
        results: materials.length,
        data: { materials }
    });

});


module.exports = {
    createMaterial,
    getAllMaterials
};

