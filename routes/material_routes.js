const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const materialControllers = require('../controllers/material_controller');
const materialMiddleWare = require('../middleware/material_middleware');
const {canSeeTopic, findTopicById} = require('../middleware/topic_middleware');

router.route('/createMaterial')
    .post(auth.adminProtect, materialMiddleWare.checkInputData,
         materialMiddleWare.checkTopicExists, materialControllers.createMaterial);

router.route('/getAllMaterials')
    .get(auth.protect, materialControllers.getAllMaterials);

router.route('/getMaterialById/:id')
    .get(auth.protect, materialMiddleWare.findMaterialById,
         materialMiddleWare.canSeeMaterial, materialControllers.getMaterialById);

router.route('/getMaterialByTopicId/:topicId')
    .get(auth.protect, findTopicById, canSeeTopic,
         materialControllers.getMaterialByTopicId);

module.exports = router;