const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


async function sendOTPEmail(email,otp){
    const msg ={
        to: email,
        from: "mostpha.mo2006@gmail.com",
        subject: "Forget password verification",
        text: "OTP",
        html: `<h3>${otp}</h3>`

    }
    await sgMail.send(msg);
}

module.exports = { 
    sendOTPEmail,
}