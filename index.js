require("dotenv").config();
const sequelize = require('./config/database');
const express = require("express");
const httpStatusCode = require('./utils/http.status');
const adminRoutes = require('./routes/admin_routes');
const dokRoutes = require('./routes/dok_routes');
const studentRoutes = require('./routes/student_routes');
const logInRoute = require('./routes/logIn_route');
const feedRoute = require('./routes/feed_routes');
const quizRoutes = require('./routes/quiz_routes');
const assignmentRoutes = require('./routes/assignment_routes');
//const submissionRoutes = require('./routes/submission_routes');
const sessionRoutes = require('./routes/session_routes');
const topicRoutes = require('./routes/topic_routes');
const leaderBoard = require('./routes/leader_board');
const materialRoutes = require('./routes/material_routes');

const app = express();

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
})();

const PORT = process.env.PORT;

// Start server
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Database syncing');
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ Failed to sync DB:', err);
    });

// Routes (keep after CORS + JSON)
app.use('/admin', adminRoutes);
app.use('/dok', dokRoutes);
app.use('/student', studentRoutes);
app.use('/login', logInRoute);
app.use('/feed', feedRoute);
app.use('/quiz', quizRoutes);
app.use('/assignment', assignmentRoutes);
app.use('/material', materialRoutes);
//app.use('/submission', submissionRoutes);
app.use('/session', sessionRoutes);
app.use('/topic', topicRoutes);
app.use('/leaderBoard', leaderBoard);

/*
// Global not-found handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: httpStatusCode.Error,
        data: { message: "This resource is not found" }
    });
});
*/

// Global error handler
app.use((error, req, res, next) => {
    if (error.name === "ValidationError") {
        error.statusMessage = httpStatusCode.Error;
        error.statusCode = 400;
        error.message = "Invalid email format";
    }

    if (res.headersSent) {
        if (req.headers.accept === "text/event-stream") {
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            return res.end();
        }
        return res.end();
    }

    res.status(error.statusCode || 400).json({
        status: error.statusMessage || httpStatusCode.Error,
        data: { message: error.message }
    });
});