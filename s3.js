// var AWS = require('aws-sdk');
var fs = require('fs');
var _ = require('lodash');

module.exports.listBucketss3 = listBucketss3; 
module.exports.creates3 = creates3; 
module.exports.uploads3 = uploads3; 
module.exports.lists3 = lists3; 
module.exports.downloads3 = downloads3; 
module.exports.uploads3text = uploads3text; 


function listBucketss3(s3){

    // Call S3 to list the buckets
    s3.listBuckets(function(err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data.Buckets);
    }
    });
}


// Create the parameters for calling createBucket
function creates3(bucketname, s3){
var bucketParams = {
    Bucket : bucketname,
    // ACL : 'public-read'
  };
  
  // call S3 to create the bucket
  s3.createBucket(bucketParams, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.Location);
    }
  });
}


// call S3 to retrieve upload file to specified bucket
function uploads3text(bucketname, title, text, s3){
    var uploadParams = {Bucket: bucketname, Key: '', Body: ''};
    uploadParams.Body = text;
    uploadParams.Key = _.kebabCase(title) + '.txt';

    // call S3 to retrieve upload file to specified bucket
    s3.upload (uploadParams, function (err, data) {
    if (err) {
        console.log("Error", err);
    } if (data) {
        console.log("Upload Success", data.Location);
    }
    });
}


//   // call S3 to retrieve upload file to specified bucket
function uploads3(bucketname, filename, s3){
    var uploadParams = {Bucket: bucketname, Key: '', Body: ''};
    var file = filename;

    // Configure the file stream and obtain the upload parameters
    var fileStream = fs.createReadStream(file);
    fileStream.on('error', function(err) {
    console.log('File Error', err);
    });
    uploadParams.Body = fileStream;
    var path = require('path');
    uploadParams.Key = path.basename(file);

    // call S3 to retrieve upload file to specified bucket
    s3.upload (uploadParams, function (err, data) {
    if (err) {
        console.log("Error", err);
    } if (data) {
        console.log("Upload Success", data.Location);
    }
    });
}


// // Call S3 to obtain a list of the objects in the bucket
function lists3(bucketname, s3){
    var bucketParams = {
        Bucket : bucketname,
        // ACL : 'public-read'
      };
    s3.listObjects(bucketParams, function(err, data) {
        if (err) {
        console.log("Error", err);
        } else {
        console.log("Success", data);
        }
    });
}




function downloads3(bucketname, newfile, oldfile, s3){
    const filePath = './' + newfile;
    const bucketName = bucketname;
    const key = oldfile;

    // var s3 = new AWS.S3();

    const downloadFile = (filePath, bucketName, key) => {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    s3.getObject(params, (err, data) => {
        if (err) console.error(err);
        fs.writeFileSync(filePath, data.Body);
        console.log(`${filePath} has been created!`);
    });
    };

    downloadFile(filePath, bucketName, key);
}

