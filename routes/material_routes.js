const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const materialControllers = require('../controllers/material_controller');
const materialMiddleWare = require('../middleware/material_middleware');

router.route('/createMaterial')
    .post(auth.adminProtect, materialMiddleWare.checkInputData,
         materialMiddleWare.checkTopicExists, materialControllers.createMaterial);

module.exports = router;