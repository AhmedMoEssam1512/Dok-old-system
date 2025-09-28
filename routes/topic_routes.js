const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const topicControllers = require('../controllers/topic_controller');
const topicMiddleWare = require('../middleware/topic_middleware');

router.route('/createTopic')
    .post(auth.adminProtect, topicMiddleWare.checkSemester,topicMiddleWare.checkSubject ,topicControllers.createTopic);

router.route('/getTopicById/:topicId')
    .get(auth.protect, topicMiddleWare.findTopicById,topicMiddleWare.canSeeTopic ,topicControllers.getTopicById);

    

module.exports = router;