const headers = require("./headers")

function errorHandle(res, errorCode, errorMessage){
    res.writeHead(errorCode, headers);
    res.write(JSON.stringify({
        status: "fail",
        message: errorMessage
    }))
    res.end()
}

module.exports = errorHandle;