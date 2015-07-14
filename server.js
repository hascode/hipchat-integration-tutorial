var http = require('http');
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var port = process.argv[2] || 8080;
var app = express();

app.use(bodyParser.json());

// serve plugin descriptor file
app.use(express.static('public'));

var oauthCred = [];

// on-install hook
app.post('/install', function(req, res){
    console.log('handling new plugin registration');


	var oauthId = req.body.oauthId
	console.log('storing oauth credentials for client with id: '+oauthId)
	oauthCred[oauthId] = req.body.oauthSecret;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end();
});

// on-message hook
app.post('/message', function(req, res){
	console.log('message received');
	console.dir(req.body);
	
	
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(JSON.stringify({ "color": "green", "message": "Blog articles for given term: ", "notify": false, "message_format": "text" }));	
});

app.listen(port);
console.log('server running at http://localhost:' + port)
