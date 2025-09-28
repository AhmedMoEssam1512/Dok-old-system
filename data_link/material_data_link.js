const sequelize = require('../config/database');
const Admin = require('../models/admin_model');
const Student = require('../models/student_model');
const asyncWrapper = require('../middleware/asyncwrapper');
const Material = require('../models/material_model');
const Topic = require('../models/topic_model');
const { Op } = require("sequelize");

Material.belongsTo(Admin, { foreignKey: "publisher" });
Material.belongsTo(Topic, { foreignKey: 'topicId' });

function createMaterial (title, description, document, topicId, publisher, uploadDate) {
    return Material.create({title, description, document, topicId, publisher, uploadDate});
} 

function getMaterialById(materialId) {
    return Material.findOne({where : {materialId}});
}

async function getAllMaterialsByGroup(group) {
    return await Material.findAll({
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
            },
            { model: Topic, attributes: ['subject'] }
        ]
    });
}

module.exports = {
    createMaterial,
    getAllMaterialsByGroup,
    getMaterialById
};