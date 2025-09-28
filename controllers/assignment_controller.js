const sequelize = require('../config/database');
const AppError = require('../utils/app.error');
const httpStatus = require('../utils/http.status');
const asyncWrapper = require('../middleware/asyncwrapper');
const Assignment = require('../models/assignment_model.js');
const assignment = require('../data_link/assignment_data_link.js');
const admin = require('../data_link/admin_data_link.js');
const student = require('../data_link/student_data_link.js');
const Admin = require('../models/admin_model.js');
const Student = require('../models/student_model.js');
const submission = require('../data_link/assignment_data_link.js');

const createAssignment = asyncWrapper(async (req, res) => {
    const {mark, document, startDate, endDate, semester, topicId}= req.body;
    const publisher = req.admin.id;
    const createdAssignment = await assignment.createAssignment
    (mark, document, startDate, endDate, semester, publisher,topicId)
    return res.status(201).json({
        status: "success" ,
        data: { message: "assignment created successfully", assignmentId: createdAssignment.assignId },
    });
});

const getAllAssignments = asyncWrapper(async (req, res) => {
    const group = req.user.group;
    // Get all quizzes based on group
    const assignments = (group === 'all'
    ? await assignment.getAllAssignments()
    : await assignment.getAllAssignmentsByGroup(group)) ;

    return res.status(200).json({
        status: "success",
        results: assignments.length,
        data: { Assignments: assignments }
    })
})

const getAssignmentById = asyncWrapper(async (req, res) => {
    const assignData = req.assignData;
    return res.status(200).json({
        status: "success",
        data: { assignData }
    });
})

const submitAssignment = asyncWrapper(async (req, res) => {
    const { answers } = req.body;
    const studentId = req.user.id;
    const found = await student.findStudentById(studentId);
    const {assignId} = req.params;
    const newSub= await assignment.createSubmission(assignId, studentId,found.assistantId ,answers, found.semester);

    return res.status(200).json({
        status: "success",
        data: { message: "Assignment submitted successfully" ,
            submissionId: newSub.id
        }
    });
})


const getUnsubmittedAssignments = asyncWrapper(async (req, res, next) => {
  const studentId = req.student.id;
  const studentProfile = await student.findStudentById(studentId);
  const group = studentProfile.group;
  const semester = studentProfile.semester;

  // Fetch all assignments for the student's group
  const allAssignments = await assignment.getAllAssignmentsByGroup(group);

  // Filter out assignments that the student has already submitted
  const unsubmittedAssignments = [];
  for (const assignment of allAssignments) {
    const existingSubmission = await submission.findSubmissionByAssignmentAndStudent(
      assignment.assignId,
      studentId
    );
    if (!existingSubmission) {
      unsubmittedAssignments.push(assignment);
    }
  }

  return res.status(200).json({
    status: "success",
    data: {
      unsubmittedAssignments,
    }
  });
});

// get by topic id

module.exports={
    createAssignment,
    getAllAssignments,
    getAssignmentById,
    submitAssignment,
    getUnsubmittedAssignments
}

