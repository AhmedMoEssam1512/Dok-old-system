const { Op } = require("sequelize"); // import Op
const sequelize = require('../config/database');
const Feed = require('../models/feed_model.js');
const Admin = require('../models/admin_model.js');

Feed.belongsTo(Admin, {
  foreignKey: 'adminId', // Feed.adminId → Admin.id (or Admin.adminId?)
  targetKey: 'adminId',       // or 'adminId' if Admin uses that as PK
  as: 'admin'            // This lets you access feed.admin.name
});

async function getAllFeeds(){
    return Feed = await Feed.findAll({
  include: [{
    model: Admin,
    attributes: [], // don't include admin as object
  }],
  attributes: {
    include: [
      [sequelize.col('Admin.name'), 'adminName'] // add admin name as flat field
    ]
  }
});
}


function getFeedByAssistantIdAndSemester(adminId, semester){
    return Feed.findAll({
        where: { adminId, semester},
        order: [['dateAndTime', 'DESC']]
    });
}

function destroyOldFeeds(cutoffDate){
    return Feed.destroy({
        where: {
            dateAndTime: {
                [Op.lte]: cutoffDate   // use Op directly
            }
        }
    });
}

function createPost(text, semester, adminId) {
    return Feed.create({    
        text,
        semester,
        adminId
    })};

module.exports = {
    getAllFeeds,
    destroyOldFeeds,
    getFeedByAssistantIdAndSemester,
    createPost
};