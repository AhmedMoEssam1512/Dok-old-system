require("dotenv").config();
const OTP = require('../data_link/forget_password');
const Admin = require('../data_link/admin_data_link');
const Student =  require('../data_link/student_data_link');
const asyncWrapper = require('../middleware/asyncwrapper');
const { json } = require("sequelize");

const otpController = asyncWrapper(async (req, res, next) => {
    // Get the data from the requeset
    const otp = req.body.otp;
    // const password = req.body.password;
    const email = req.body.email;

    const found = await OTP.findOTP(email,otp);
    const expired = OTP.expired(otp);
    console.log(expired);
    
    // check if the otp and email are in the same record 
    if (found) {
        // check if the otp is not expired
        if (expired) {
            res.json({
                status: "This OTP is expired",
            });
        }
        OTP.verifyOTP(email,otp);
        res.json({
            status: "WORKED"
        }) 
        
    }
});

const resetPassword = asyncWrapper(async (req, res, next) => {
    const email = req.params.email;
    const password = req.body.password;

    const verified = await OTP.findOTPByEmail(email);
    if(!verified.verified){
        res.json({
            status:"OTP not verified"
        })
    }
        // admin requested this otp ?
        const isAdmin = await Admin.findAdminByEmail(email);
        if (isAdmin) {
            await OTP.updateAdminPassByEmail(email,password);
            await OTP.deleteOTP(email,verified.otp);
            res.json({
                status:"success",
                info: "Admin password updated"
            });
        }
        
        // Student requested otp ?
        const isStudent = await Student.findStudentByEmail(email);
        if (isStudent) {
            await OTP.updateStudentPassByEmail(email,password);
            await OTP.deleteOTP(email,verified.otp);
            res.json({
                status:"success",
                info: "Student password updated"
            });
        }

})




module.exports = {
    otpController,
    resetPassword
};
