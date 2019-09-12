'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Mongoose Schema
const shortenedURLSchema = new mongoose.Schema({
  originalUrl: String,
  shortenedUrl: String,
  urlNumber: Number,
  urlPath: String
});

const urlCountSchema = new mongoose.Schema({
  currentCount: Number
})

// Mongoose Model
const ShortenedURL = mongoose.model('ShortenedURL', shortenedURLSchema);
const URLCount = mongoose.model('URLCount', urlCountSchema)

// Load existing URLs
ShortenedURL.find({},function(err,urls){
	if(err){
		console.log(err)
	}
	else{
		for (let eachUrl in urls){
			app.get(eachUrl.urlPath,(req,res)=>{
				res.redirect(eachUrl.originalUrl);
			})
		}
	}
})

app.post("/api/shorturl/new", function (req, res){
	//let expression = /http(s)?:\/\/www\.[a-z]*\.com(\/\w*\/\w*)?/
	let inputURL = null;
	try{
		inputURL = new URL(req.body.url)
	}
	catch(err){
		console.log(err);
		invalidURL(res);
	}

	dns.lookup(inputURL.hostname,function (err,result){
		if(err){
			invalidURL(res);
		}
		else{
			recordURL(input,res)
		}
	})
})

function invalidURL(res){
	return res.json({error: "invalid URL"})
}

function recordURL(input,res){
	URLCount.find({}).then(function(err, result){
		if(err){
			console.log(err)
		}
		else{
			if (result.length === 0){
				let urlCount = new URLCount({currentCount:1})
				urlCount.save()
				return 1
			}
			else{
				let urlCount = result[0];
				urlCount.currentCount = urlCount.currentCount + 1;
				urlCount.save()
				return urlCount.currentCount
			}
		}
	}).then	(currentCount =>{
		let newURL = new ShortenedURL({originalUrl:input.href, 
								shortenedUrl:"localhost:8080"+ currentCount, 
								urlPath:"/api/shorturl/"+currentCount,
								urlNumber:currentCount});
		app.get(newURL.urlPath,function(req,res){
			res.redirect(newURL);
		})

		res.json({
			original_url: newURL.originalUrl,
			short_url: newURL.urlNumber
		})

		newURL.save(function(err){
			if(err){
				console.log(err);
			}
		})
	})
}

app.listen(port, function () {
  console.log('Node.js listening ...');
});