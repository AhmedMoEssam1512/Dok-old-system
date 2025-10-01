const sequelize = require('../config/database');
const Student = require('../models/student_model.js');
const student = require('../data_link/student_data_link');
const admin = require('../data_link/admin_data_link.js');
const session = require('../data_link/session_data_link.js');
const bcrypt = require('bcrypt');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const { getCache } = require("../utils/cache");
const { setCache } = require("../utils/cache");
const jwt = require("jsonwebtoken");
const sse = require('../utils/sseClients.js');
const {sanitizeInput} = require('../utils/sanitize.js');
const topicDl = require('../data_link/topic_data_link.js'); 

const startSession = asyncWrapper(async (req, res) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    sanitizeInput(req.body);
  const adminId = req.admin.id;
  const sgroup = req.body.group || req.admin.group;
  console.log(sgroup); 
  const adminN = await admin.findAdminById(adminId);
  const adminName = adminN.name;
  const today = new Date();
  const dayName = days[today.getDay()];
  const currTopic = await topicDl.getStudentLastTopic(sgroup);
  const newSession = await admin.createSession(currTopic.topicId,sgroup, currTopic.semester, today, dayName);

   sse.notifyStudents(sgroup, {
        event: "New Session Date",
        message: `Group ${sgroup}, a date for the upcoming session has been dropped by ${adminName}. Please check your dashboard.`,
        post: {
            number: number,
            semester: semester,
            dateAndTime: dateAndTime,
        },
      });
  return res.status(201).json({
    status: "success",
     message: "Session created successfully",
    data: { id: newSession.sessionId,
        topicId: newSession.topicId,
        group: newSession.group,
        semester: newSession.semester,
        dateAndTime: newSession.dateAndTime,
        day: newSession.day
     }
  })});


const endSession = asyncWrapper(async (req, res, next) => {
    const adminGroup = req.admin.group;
    const currSession = session.getActiveSessionByGroup(adminGroup);
    if (!currSession) {
        return next(new AppError("No active session found for your group", httpStatus.NOT_FOUND));
    }
    currSession.finished = true;
    await currSession.save();
    return res.status(200).json({
        status: "success",
        data: { message: "Session ended successfully" }
    });
})

// const attendSession = asyncWrapper(async (req, res, next) => {
//     sanitizeInput(req.params);
//     const sessionId = req.activeSession?.sessionId || req.params.sessionId;
//     if (!sessionId) {
//         return next(new AppError("Session ID missing", httpStatus.BAD_REQUEST));
//     }

//     const decoded = jwt.verify(
//         req.headers.authorization.split(' ')[1],
//         process.env.JWT_SECRET
//     );
//     const studentId = decoded.id;

//     const studentData = await student.findStudentById(studentId);
//     const sem = studentData.semester;

//     await student.createAttendance(studentId, sessionId, sem);

//     return res.status(200).json({
//         status: "success",
//         data: { message: "Attendance recorded successfully" }
//     });
// });



// // const startSession = asyncWrapper(async (req, res) => {
// //     sanitizeInput(req.params);
// //     const { sessionId } = req.params;
// //     const adminGroup = req.admin.group;
    
// //     const sessionsData = await session.findSessionById(sessionId);
// //     if (!sessionsData) {
// //         return next(new AppError("Session not found", httpStatus.NOT_FOUND));
// //     }

// //     // Update session start time
// //     await session.UpdateSession(sessionId, new Date());

// //     const cacheKey = `activeSession:${adminGroup}`;

// //     // ✅ no need to remap keys
// //     await setCache(cacheKey, sessionsData, 9000);

// //     // Notify students
// //     sse.notifyStudents(adminGroup, {
// //         event: "Session Started",
// //         message: `Group ${adminGroup}, the session has started. Please join using the provided link.`,
// //         post: {
// //             sessionId: sessionsData.sessionId, // 👈 already exists
// //             link: sessionsData.link,
// //             dateAndTime: sessionsData.dateAndTime
// //         },
// //     });

// //     return res.status(200).json({
// //         status: "success",
// //         data: { message: "Session started and students notified" }
// //     });
// // });

// const getActiveSession = asyncWrapper(async (req, res, next) => {
//     const activeSession = req.activeSession;
//     return res.status(200).json({
//         status: "success",
//         data: { activeSession }
//     });
// });

// const getUpcomingSession = asyncWrapper(async (req, res) => {
//   return res.status(200).json({
//     status: "success",
//     data: { upcoming: req.upcomingSession }
//   });
// });


module.exports = {
   // attendSession,
    startSession,
    endSession,
    // getActiveSession,
    // getUpcomingSession
}