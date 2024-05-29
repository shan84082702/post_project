const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*", //讓所以伺服器IP造訪
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE", //允許的method
    "Content-Type": "application/json"
};

module.exports = headers;