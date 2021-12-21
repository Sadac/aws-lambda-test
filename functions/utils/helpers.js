const parseBody = (body) => {
    if(body){
        return JSON.parse(body)
    }
    return {}
}

module.exports = {
    parseBody
}