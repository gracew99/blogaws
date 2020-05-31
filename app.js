//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const date = require(__dirname+"/date.js");
// Load the full build.
var _ = require('lodash');
var mongoose = require('mongoose');
var fs = require('fs');
const multer = require('multer'); // "multer": "^1.1.0"
const multerS3 = require('multer-s3'); //"^1.4.1"


// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
var AWSdb = require("aws-sdk");
var AWS3 = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');
const aws_s3 = require(__dirname+"/s3.js");
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

// from inits3
AWS3.config.update({
  region: "us-west-2",
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey

});

// Create S3 service object
var s3 = new AWS3.S3({apiVersion: '2006-03-01'});
aws_s3.creates3("nodejs3bucket", s3, function(){
  aws_s3.listBucketss3(s3);
  aws_s3.uploads3("nodejs3bucket", "./helloworld.pdf", s3, function(){
    aws_s3.lists3("nodejs3bucket", s3);
    aws_s3.downloads3("nodejs3bucket", "download.png", "schedule.png", s3);
  });
});
var unique_id;
var s3id;


var upload = multer({
  storage: multerS3({
      s3: s3,
      bucket: 'nodejs3bucket',
      key: function (req, file, cb) {
          unique_id = uuidv4();
          s3id = unique_id.substring(0,10) + file.originalname.slice(-4);
          console.log(file);
          console.log(s3);
          cb(null, s3id); //use Date.now() for unique file keys
      }
  })
});


// db.initdb();

var docClient = new AWSdb.DynamoDB.DocumentClient();
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
      const params1 = {
        Bucket: "nodejs3bucket",
        Key: data.Item.modified_id
      };
      
      s3.getObject(params1, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });

      var linkbuilder = "https://nodejs3bucket.s3-us-west-2.amazonaws.com/" + params1.Key;

      res.render("post", {
        post: data.Item,
        imglink: linkbuilder
      }); 
    }


  });


});

app.get("/compose", function(req, res){
  res.render("compose", {
    title: "Compose",
  });
});

//used by upload form for multer s3
app.post('/upload', upload.array('document',1), function (req, res, next) {
  db.putdb(table, unique_id, s3id, req.body.post, req.body.title, docClient, function(data){
    if (data === null){
      res.render("page", {
        title: "Error: No such post",
        intro: ""
      });
    }
    else{
      // aws_s3.uploads3text("nodejs3bucket", req.body.title, req.body.post, s3);
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