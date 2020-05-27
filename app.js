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

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const titles = [];

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


AWS.config.update({
  region: "us-west-2",
  endpoint: "http://dynamodb.us-west-2.amazonaws.com",
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey

});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "Blogdb",
    KeySchema: [       
        { AttributeName: "id", KeyType: "HASH"},  //Partition key
    ],
    AttributeDefinitions: [    
        { AttributeName: "id", AttributeType: "S" },   
        { AttributeName: "date", AttributeType: "S" },   

    ],
    GlobalSecondaryIndexes: [ 
      { 
         IndexName: "DateTimeIndex",
         KeySchema: [ 
            { 
               AttributeName: "date",
               KeyType: "HASH"
            }
         ],
         Projection: { 
            ProjectionType: "ALL"
         },
         ProvisionedThroughput: { 
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
         }
      }
   ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 1, 
        WriteCapacityUnits: 1
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

var docClient = new AWS.DynamoDB.DocumentClient();
var table = "Blogdb";


app.get("/", function(req, res){
  var params = {
    TableName: table,
  }

  console.log("Scanning Movies table.");
  docClient.scan(params, onScan);

  function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        res.render("home", {
          title: "Home",
          intro: homeStartingContent,
          posts: data.Items,
        });
    }
  }

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
  var params = {
    TableName: table,
    Key:{
        "id": pid
    }
  };

  docClient.get(params, function(err, data) {
    if (err) {
      res.render("page", {
        title: "Error: No such post",
        intro: ""
      });
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      res.render("post", {
        post: data.Item,
      }); 
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
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
  var postdate = date.date();

  var params = {
    TableName:table,
    Item:{
        "id": uuidv4(),
        "title": req.body.title,
        "body": req.body.post,
        "date": postdate,
    }
  };

  console.log("Adding a new item...");
  docClient.put(params, function(err, data) {
    if (err) {
      console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      res.render("page", {
        title: "Error: No such post",
        intro: ""
      });
    }
    else{
      res.redirect("/");
      console.log("Added item:", JSON.stringify(data, null, 2));
    }
  });

  const msg = {
    to: [
      {email: '7.knicksfan.7@gmail.com'}, 
      {email: 'gw297@scarletmail.rutgers.edu'}],
    from: '7.knicksfan.7@gmail.com',
    subject: req.body.title,
    text: req.body.post
  };
  sgMail.send(msg, function(err){
    if (err)
      console.log(err);
    else
      console.log("sent");

  });
  

});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
    console.log("Server started successfully");
});