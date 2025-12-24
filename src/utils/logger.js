function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (level === 'ERROR') {
        console.error(logMessage, data);
    } else {
        console.log(logMessage, data);
    }
}

module.exports = { log };
