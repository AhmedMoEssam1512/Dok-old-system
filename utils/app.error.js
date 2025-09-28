class appError extends Error {
    static create(message, statusCode, statusMessage) {
        const error = new appError();
        error.message = message;
        error.statusCode = statusCode;
        error.statusMessage = statusMessage;
        return error;
    }
}

module.exports = appError;