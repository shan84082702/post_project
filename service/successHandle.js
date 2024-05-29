const headers = require("./headers")

function successHandle(res, data){
    res.writeHead(200, headers);
    res.write(JSON.stringify({
        status: "success",
        posts: data
    }))
    res.end()
}

module.exports = successHandle;