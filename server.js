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
	console.log('new search request received');
	console.dir(req.body);
	
	var term = req.body.item.message.message.split(' ')[1];
	console.log('searching for given term: '+term);
	
	var message = "<a href=\"http://www.hascode.com/\">hasCode.com</a> blog articles for given term: <b>&quot;"+term+"&quot;</b>:";
	
	
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(JSON.stringify({ "color": "green", "message": message, "notify": false, "message_format": "html" }));	
});

app.listen(port);
console.log('server running at http://localhost:' + port)
