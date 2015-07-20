var http = require('http');
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

var basePath = '/wp-content/byTag.php?tag=';
var port = process.argv[2] || 8080;
var maxResults = process.argv[3] || 10;
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
			var hitsNum = hits.length;
			console.log(hitsNum+' results for term '+term+' found, max-results set to: '+maxResults);
			message+=' ('+hitsNum+' hit/s) <ul>';
			message += hits.slice(0, maxResults).reduce(function(prev, cur){
				return createMessage(prev) + createMessage(cur);
			}, "");
			message+='</ul>';
			if(hits.length>maxResults){
				message+='<b><a href="http://www.hascode.com/tag/'+term+'">Show all '+hitsNum+' results for &quot;'+term+'&quot;</a></b>'
			}
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

function createMessage(hit){
	if(typeof hit === 'string'){
		return hit;
	}
	return '<li><a href=\"'+hit.url+'\">'+hit.title+'</a></li>';	
}

app.listen(port);
console.log('server running at http://localhost:' + port)
