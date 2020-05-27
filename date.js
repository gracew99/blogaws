module.exports.date = date;
module.exports.time = time;

function date(){
    var d= new Date();
    return (d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate());
}


function time(){
    var d= new Date();
    return (d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds());
}

