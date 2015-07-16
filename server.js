var http = require('http');
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var basePath = '/wp-content/byTag.php?tag=';
var port = process.argv[2] || 8080;
var options = {
  host: 'www.hascode.com',
  path: '/',
  method: 'GET',
  headers: {
	   'Content-Type': 'application/json'
   }
};
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
	
	var message = "<a href=\"http://www.hascode.com/\">hasCode.com</a> blog articles for given term: <b>&quot;"+term+"&quot;</b>";

	options.path=basePath+term;
	var req = http.request(options, function(clientResponse){
		var output = '';
		clientResponse.setEncoding('utf8');

		clientResponse.on('data', function (chunk) {
			output += chunk;
		});
		
		clientResponse.on('end', function() {
			var hits = JSON.parse(output);
			console.log(hits.length+' results for term '+term+' found');
			message+=' ('+hits.length+' hits) <ul>'; 
			message += hits.reduce(function(prev, cur){
				var item = '<li><a href="'+cur.url+'">'+cur.title+'</a></li>';
				return prev ? prev+item : ""+item;
			});
			message+='</ul>';
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({ "color": "green", "message": message, "notify": false, "message_format": "html" }));	
		});
	});

	req.on('error', function(err) {
		console.log('error: ' + err.message);
		res.writeHead(200, {'Content-Type': 'application/json'});
		message+=' request failed with message: <em>'+err.message+'</em>';
		res.end(JSON.stringify({ "color": "green", "message": message, "notify": false, "message_format": "html" }));	
	});

	req.end();
});

app.listen(port);
console.log('server running at http://localhost:' + port)
