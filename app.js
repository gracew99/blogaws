//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const date = require(__dirname+"/date.js");
// Load the full build.
var _ = require('lodash');
var mongoose = require('mongoose');
// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
var AWS = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');
const s3 = require(__dirname+"/s3.js");
const db = require(__dirname+"/db.js");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const titles = [];

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


s3.inits3();
// s3.creates3("nodejs3bucket");
// s3.uploads3("nodejs3bucket", "./helloworld.pdf");
s3.lists3("nodejs3bucket");
// s3.downloads3("nodejs3bucket", "download.pdf", "helloworld.pdf");


db.initdb();

var docClient = new AWS.DynamoDB.DocumentClient();
var table = "TestBlogdb";


app.get("/", function(req, res){
  // this ensures that we will render AFTER we have retrieved data
  db.querydb(table, docClient, function(data){
    res.render("home", {
      title: "Home",
      intro: homeStartingContent,
      posts: data.Items,
    });  
  });  

});

app.get("/about", function(req, res){
  res.render("page", {
    title: "About",
    intro: aboutContent
  });
});


app.get("/contact", function(req, res){
  res.render("page", {
    title: "Contact",
    intro: contactContent
  });
});

app.get('/posts/:postId', function (req, res) {
  const pid = req.params.postId;
  db.getdb(table, pid, docClient, function(data){
    if (data === null){
      res.render("page", {
        title: "Error: No such post",
        intro: ""
        });
    }
    else{
      res.render("post", {
        post: data.Item,
      }); 
    }
  });

});

app.get("/compose", function(req, res){
  res.render("compose", {
    title: "Compose",
  });
});

app.post("/compose", function(req, res){
  // const link = "/posts/" + _.kebabCase(req.body.title);
  db.putdb(table, req.body.post, req.body.title, docClient, function(data){
    if (data === null){
      res.render("page", {
        title: "Error: No such post",
        intro: ""
      });
    }
    else{
      res.redirect("/");
    }
  });
  
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
    console.log("Server started successfully");
});