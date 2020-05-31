var AWSdb = require('aws-sdk');
const date = require(__dirname+"/date.js");
const { v4: uuidv4 } = require('uuid');

module.exports.initdb = initdb;
module.exports.querydb = querydb;
module.exports.getdb = getdb;
module.exports.putdb = putdb;

function initdb(){
    AWSdb.config.update({
        region: "us-west-2",
        endpoint: "http://dynamodb.us-west-2.amazonaws.com",
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey
      });
      var dynamodb = new AWSdb.DynamoDB();
      
      var params = {
          TableName : "TestBlogdb",
          KeySchema: [       
              { AttributeName: "id", KeyType: "HASH"},  //Partition key
          ],
          AttributeDefinitions: [    
              { AttributeName: "id", AttributeType: "S" },    
              { AttributeName: "postdate", AttributeType: "S" },
              { AttributeName: "posttime", AttributeType: "S" }
      
          ],
          GlobalSecondaryIndexes: [ 
            { 
               IndexName: "DateTimeIndex",
               KeySchema: [ 
                  { 
                     AttributeName: "postdate",
                     KeyType: "HASH"
                  },
                  { 
                    AttributeName: "posttime",
                    KeyType: "RANGE"
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
}

function querydb(table, docClient, render){
    var today = date.date();

    var params = {
        TableName: table,
        IndexName: "DateTimeIndex",
        KeyConditionExpression: "postdate = :date1",
        ExpressionAttributeValues: {
          ":date1": today
        }
      };
      docClient.query(params, onquery);
    
      function onquery(err, data) {
        if (err) {
            console.error("Unable to query the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // console.log(data.Items);
            render(data);
        }
      }
}


function getdb(table, pid, docClient, render){
    var params = {
        TableName: table,
        Key:{
            "id": pid
        }
    };

    docClient.get(params, function(err, data) {
    if (err) {
        render(null);
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        render(data);
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
    }
    });
}

function putdb(table, id, modified_id, post, title, docClient, render){
    var postdate = date.date();
    var posttime = date.time();

    // if (typeof variable == 'undefined') {
    //     id = uuidv4();
    //     modified_id = id;
    // }
    // console.log(id + " " + modified_id);
    var params = {
        TableName:table,
        Item:{
            "id": id,
            "modified_id": modified_id,
            "body": post,
            "title": title,
            "postdate": postdate,
            "posttime": posttime

        }
    };

    console.log("Adding a new item...");
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            render(null);
        }
        else{
            render(true);
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
        const msg = {
            to: [
            {email: '7.knicksfan.7@gmail.com'}, 
            {email: 'gw297@scarletmail.rutgers.edu'}],
            from: '7.knicksfan.7@gmail.com',
            subject: title,
            text: post
        };
        // sgMail.send(msg, function(err){
        //     if (err)
        //     console.log(err);
        //     else
        //     console.log("sent");

        // });
    
    });
}