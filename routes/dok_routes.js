const express = require('express');
const router = express.Router();
const dokmiddleware = require('../middleware/dok_middleware');
const DOK = require('../controllers/dok_controller.js');
const auth = require('../middleware/auth_middleware');

router.route('/signUp')
    .post(DOK.DOK_signUp);

router.route('/rejectAssistant/:email')
    .delete(auth.adminProtect, dokmiddleware.checkRole,dokmiddleware.findAdmin ,DOK.rejectAssistant);

router.route('/acceptAssistant/:email')
    .patch(auth.adminProtect, dokmiddleware.checkRole, dokmiddleware.findAdmin, DOK.acceptAssistant);

router.route('/showPendingAssistantRegistration')
    .get(auth.adminProtect, dokmiddleware.checkRole, DOK.showPendingRegistration);

router.route('/removeAssistant/:email')
    .delete(auth.adminProtect, dokmiddleware.checkRole, dokmiddleware.findAdmin, DOK.removeAssistant);

router.route('/checkAssistantInGroup/:group')
    .get(auth.adminProtect, dokmiddleware.checkRole, DOK.checkAssistantGroup);    

router.route('/assignGroupToAssistant/:id')
    .patch(auth.adminProtect, dokmiddleware.checkRole, DOK.assignGroupToAssistant);

module.exports = router;