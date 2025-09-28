const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const adminControllers = require('../controllers/admin_controller');
const adminMiddleWare = require('../middleware/admin_middleware');
const { establishAdminConnection } = require('../controllers/SSE_connection');
const subMiddleWare = require('../middleware/submission_middleware');


router.route('/adminRegister')
    .post(adminMiddleWare.adminFound,adminMiddleWare.passwordEncryption,adminControllers.TARegister);

router.route('/adminSSE')
    .get(auth.adminProtect, establishAdminConnection);

router.route('/pendingRegistrations')
    .get(auth.adminProtect, adminControllers.showPendingRegistration);

router.route('/verifyStudent/:studentEmail')
    .patch(auth.adminProtect, adminMiddleWare.studentFound, adminControllers.verifyStudent);

router.route('/rejectStudent/:studentEmail')
    .patch(auth.adminProtect, adminMiddleWare.studentFound,adminMiddleWare.canReject ,adminControllers.rejectStudent);

router.route('/checkStudentInGroup/:group')
    .get(auth.adminProtect, adminControllers.showStudentInGroup);   
    
router.route('/removeStudent/:studentEmail')
    .delete(auth.adminProtect, adminMiddleWare.checkAuthurity, adminControllers.removeStudent);

router.route('/banStudent/:studentEmail')
    .patch(auth.adminProtect, adminMiddleWare.checkAuthurity, adminControllers.banStudent);

router.route('/unBanStudent/:studentEmail')
    .patch(auth.adminProtect, adminMiddleWare.checkAuthurity, adminControllers.unBanStudent);

router.route('/showMyProfile')
    .get(auth.adminProtect, adminControllers.showMyProfile);

router.route('/showStudentProfile/:studentId')
    .get(auth.adminProtect,adminMiddleWare.checkAuthurityByID ,adminControllers.showStudentProfile);

router.route('/showUnmarkedSubmissions')
    .get(auth.adminProtect,adminControllers.showUnmarkedSubmissions);

router.route('/findSubmissionById/:id')
    .get(auth.adminProtect,subMiddleWare.subExist,subMiddleWare.canSeeSubmission, adminControllers.findSubmissionById );

router.route('/showAllSubmissions')
    .get(auth.adminProtect,adminControllers.showAllSubmissions);

router.route('/markSubmission/:id')
    .patch(auth.adminProtect,subMiddleWare.subExist,subMiddleWare.canSeeSubmission,
        subMiddleWare.marked,subMiddleWare.checkData, adminControllers.markSubmission );

module.exports = router;