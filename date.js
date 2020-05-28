module.exports.date = date;
module.exports.time = time;

function date(){
    var d= new Date();
    return (d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate());
}


function time(){
    var d= new Date();
    return (("0"+d.getHours()).slice(-2) + ":" + ("0"+d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2));
}

