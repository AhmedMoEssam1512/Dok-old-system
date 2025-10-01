const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const sessionControllers = require('../controllers/session_controller');
const { establishAdminConnection } = require('../controllers/SSE_connection');
const studentControllers = require('../controllers/student_controller');
const studentMiddleWare = require('../middleware/student_middleware');
const sessionMiddleWare = require('../middleware/session_middleware');

// router.route('/attendSession/:sessionId')
//     .post(auth.studentProtect, sessionMiddleWare.sessionFound,sessionMiddleWare.canAccessActiveSession, sessionMiddleWare.sessionStarted, studentMiddleWare.attendedSessionBefore, sessionControllers.attendSession);

// router.route('/createSession')
//     .post(auth.adminProtect, sessionControllers.createSession);

// router.route('/startSession/:sessionId')
//     .patch(auth.adminProtect, sessionMiddleWare.sessionFound, sessionMiddleWare.canAccessSession, sessionControllers.startSession);    

// router.route('/getActiveSession')
//     .get(auth.studentProtect, sessionMiddleWare.activeSessionExists, sessionMiddleWare.canAccessActiveSession, sessionControllers.getActiveSession);

// router.route('/getUpcomingSession')
//     .get(auth.studentProtect, sessionMiddleWare.upcomingSession, sessionControllers.getUpcomingSession);

router.route('/startSession')
    .post(auth.adminProtect, sessionControllers.startSession);

router.route('/endSession') 
    .patch(auth.adminProtect, sessionControllers.endSession);


module.exports = router;