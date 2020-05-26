module.exports.date = date;

function date(){
    var d= new Date();
    return (d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate());
}