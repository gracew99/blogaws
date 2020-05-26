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
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const titles = [];

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://newuser:newpassword@cluster0-shard-00-00-b3bgw.mongodb.net:27017,cluster0-shard-00-01-b3bgw.mongodb.net:27017,cluster0-shard-00-02-b3bgw.mongodb.net:27017/todolistdb?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority");var postSchema = new mongoose.Schema({
  title: String,
  body: String,
  date: String,
  // link: String
});

var Post = mongoose.model('Post', postSchema);


app.get("/", function(req, res){
  Post.find(function(err, posts){
    res.render("home", {
      title: "Home",
      intro: homeStartingContent,
      posts: posts,
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
  // titles.forEach(function(title){
  //   if (title=== pname){
  //     console.log("yes");
  //   }
  // });


  // non db versio
  // const index = _.findIndex(titles, function(title){
  //   return _.kebabCase(title) === pname;
  // });

  Post.findOne({_id: pid}, function(err, found){ 
    if (err){
      res.render("page", {
        title: "Error: No such post",
        intro: ""
      });
    }
    else{
      res.render("post", {
        post: found,
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
  var postdate = date.date();
  var post = new Post({
    title: req.body.title,
    body: req.body.post,
    date: postdate,
    // link: link
  });

  post.save(function(err){
    if (err) {
      res.render("page", {
        title: "Error: No such post",
        intro: ""
      });
    }
    else
      res.redirect("/");

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
