const sequelize = require('../config/database');
const Admin = require('../models/admin_model.js');
const Student = require('../models/student_model.js');
const bcrypt = require('bcrypt');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const jwt = require("jsonwebtoken");
const Regection = require('../models/rejection_model.js');
const rejection = require('../data_link/admin_data_link');
const Registration = require('../models/registration_model.js');
const registration = require('../data_link/admin_data_link');
const admin = require('../data_link/admin_data_link.js');
const student = require('../data_link/student_data_link.js');
const feed = require('../data_link/admin_data_link.js');
const sse = require('../utils/sseClients.js');

const TARegister = asyncWrapper(async (req, res) => {
    const { email, name, password, phoneNumber, group} = req.body;
    const encryptedPassword = await bcrypt.hash(String(password), 10);
    await admin.create(email,name,password,phoneNumber,group);

    return res.status(201).json({
        status: "success" ,
        data: { message: "Assistant created successfully" }
    });
});



const showPendingRegistration = asyncWrapper(async (req, res) => {
  const TAGroup = req.admin.group;
    const students = await admin.findNotVerifiedStudentsByTaGroup(TAGroup);
    return res.status(200).json({
        status: "success",
        message: `Pending registration from students`,
        data: { 
  data: students.map(student => ({
      name: student.studentName,
      email: student.studentEmail,
      group: student.group
    }))
}})});

const verifyStudent = asyncWrapper(async (req, res) => {
  const student = req.student; // must be set earlier by studentFound
  student.verified = true;
  student.assistantId = req.admin.id; // set the admin who verified
  await student.save();
  await rejection.Destroy( student.studentEmail);
  await registration.registrationDestroy(student.studentEmail);
  return res.status(200).json({ 
    status: "success",
    message: `Student ${student.studentName} verified successfully`,
    data: { studentEmail: student.studentEmail }
  });
});

const showStudentInGroup = asyncWrapper(async (req, res) => {
    const TAGroup = req.admin.group;
    const students = await admin.findVerifiedStudentsByTaGroup(TAGroup);
    return res.status(200).json({
        status: "success",
        message: `Students in group ${TAGroup}`,
        data: { 
  data: students.map(student => ({
      name: student.studentName,
      email: student.studentEmail,
    }))
}})});


const removeStudent = asyncWrapper(async (req, res) => {
  const student = req.student; // must be set earlier by studentFound
  await student.destroy();
  return res.status(200).json({
    status: "success",
    message: `Student ${student.studentName} deleted successfully`,
    data: { studentEmail: student.studentEmail }
  });
});

const banStudent = asyncWrapper(async (req, res) => {
  const student = req.student; // must be set earlier by studentFound
  student.banned = true; // assuming you have a banned field
  await student.save();
  return res.status(200).json({
    status: "success",
    message: `Student ${student.studentName} banned successfully`,
    data: { studentEmail: student.studentEmail }
  });
});

const unBanStudent = asyncWrapper(async (req, res) => {
  const student = req.student; // must be set earlier by studentFound
  student.banned = false; // assuming you have a banned field
  await student.save();
  return res.status(200).json({
    status: "success",
    message: `Student ${student.studentName} unbanned successfully`,
    data: { studentEmail: student.studentEmail }
  });
});

const rejectStudent = asyncWrapper(async (req, res) => {
  const student = req.student; // must be set earlier by studentFound
  const adminId = req.admin.id;
  console.log(adminId) // assuming adminId is available in req.admin
  await rejection.createRejection(student.studentEmail,adminId,student.semester);
  const rej = await registration.findRegistration(student.studentEmail);
  rej.rejectionCount += 1;
  await rej.save();
  const adminCount = await admin.Count(student.group);
  console.log("adminCount : ", adminCount);
  if (rej.rejectionCount >= adminCount) {
    await registration.registrationDestroy(student.studentEmail);
    await student.destroy();
    await rejection.Destroy(student.studentEmail);
  }
  return res.status(200).json({
    status: "success",
    message: `Student ${student.studentName} rejected successfully`,
    data: { studentEmail: student.studentEmail }
  });
});

const showMyProfile = asyncWrapper(async (req, res) => {
  const adminId = req.admin.id;
  const adminProfile = await admin.findAdminById(adminId);
  return res.status(200).json({
    status: "success",
    data: {
      id : adminProfile.adminId,
      adminName: adminProfile.name,
      adminEmail: adminProfile.email,
      PhoneNumber: adminProfile.phoneNumber,
      group : adminProfile.group
    }
  });
});

const showStudentProfile= asyncWrapper(async (req, res) => {
  const studentProfile = req.student; // must be set earlier by studentFound
  return res.status(200).json({
    status: "success",
    data: {
      id: studentProfile.studentId,
      studentName: studentProfile.studentName,
      studentEmail: studentProfile.studentEmail,
      birthDate: studentProfile.birthDate,
      studentPhoneNumber: studentProfile.studentPhoneNumber,
      parentPhoneNumber: studentProfile.parentPhoneNumber,
      parentEmail: studentProfile.parentEmail,
      group : studentProfile.group,
      semester: studentProfile.semester,
      totalScore: studentProfile.totalScore
    }
  });
});

const showUnmarkedSubmissions = asyncWrapper(async (req, res) => {
    const adminId = req.admin.id;
    const adminProfile = await admin.findAdminById(adminId);
    console.log(adminId);
    const pendingSubmissions = (adminId === 1
        ? await admin.getAllUnmarkedSubmissions()
        : await admin.getUnmarkedSubmissionsByAdminId(adminId));

    if (!pendingSubmissions || pendingSubmissions.length === 0) {
        return res.status(200).json({ message: "No unmarked submissions found" });
    }
    return res.status(200).json({
        status: "success",
        message: `Unmarked submissions for admin ${adminProfile.name}`,
        data: {
            submissions: pendingSubmissions.map(submission => ({
                id: submission.subId,
                studentId: submission.studentId,
                quizId: submission.quizId,
                assignmentId: submission.assId,
                submittedAt: submission.createdAt
            }))
        }
    });
});

const findSubmissionById = asyncWrapper(async (req, res) => {
    const found = req.found;
    return res.status(200).json({
        status: "success",
        data: {found}
    })
})

const showAllSubmissions = asyncWrapper(async (req, res) => {
    const assistantId = req.admin.id;
    const adminProfile = await admin.findAdminById(assistantId);
    console.log(assistantId);
    const submissions = (assistantId === 1
        ? await admin.getAllSubmissions()
        : await admin.getAllSubmissionsById(assistantId));

    if (!submissions || submissions.length === 0) {
        return res.status(200).json({ message: "No unmarked submissions found" });
    }
    return res.status(200).json({
        status: "success",
        message: `Unmarked submissions for admin ${adminProfile.name}`,
        data: {
            submissions: submissions.map(submission => ({
                id: submission.subId,
                studentId: submission.studentId,
                quizId: submission.quizId,
                assignmentId: submission.assId,
                submittedAt: submission.createdAt
            }))
        }
    });

})

const markSubmission = asyncWrapper(async (req, res) => {
    const found = req.found;
    const studentSub = await student.findStudentById(found.studentId)   ;
    const {marked,score } = req.body
    found.score = score;
    found.marked = marked;
    found.markedAt = new Date();
    studentSub.totalScore += score;
    await studentSub.save();
    await found.save();
    return res.status(200).json({
        status: "success",
        message: `Submission marked successfully`,
    })
})

module.exports = {
    TARegister,
    showPendingRegistration,
    showStudentInGroup,
    verifyStudent,
    removeStudent,
    banStudent,
    unBanStudent,
    rejectStudent,
    showMyProfile,
    showStudentProfile,
    showUnmarkedSubmissions,
    findSubmissionById,
    showAllSubmissions,
    markSubmission
}

