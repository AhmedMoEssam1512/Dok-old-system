// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { logIn } = require("../controllers/logIn");
const { forgetPassword } = require("../controllers/forget_password");
const { otpController,resetPassword } = require("../controllers/otp");

router.post("/", logIn);

router.post("/forgetPassword",forgetPassword);

router.post('/otp',otpController);

router.post('/resetPassword/:email',resetPassword);

module.exports = router;