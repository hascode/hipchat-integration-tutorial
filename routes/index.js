var http = require('http');

module.exports = function (app, addon) {
    var hipchat = require('../lib/hipchat')(addon);
    var basePath = '/wp-content/byTag.php?tag=';
    var maxResults = 10;
    var options = {
        host: 'www.hascode.com',
        path: '/',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Root route. This route will serve the `addon.json` unless a homepage URL is
    // specified in `addon.json`.
    app.get('/',
        function (req, res) {
            // Use content-type negotiation to choose the best way to respond
            res.format({
                // If the request content-type is text-html, it will decide which to serve up
                'text/html': function () {
                    res.redirect(addon.descriptor.links.homepage);
                },
                // This logic is here to make sure that the `addon.json` is always
                // served up when requested by the host
                'application/json': function () {
                    res.redirect('/atlassian-connect.json');
                }
            });
        }
    );

    // This is an example route to handle an incoming webhook
    app.post('/message',
        addon.authenticate(),
        function (req, res) {
            var term = req.body.item.message.message.split(' ')[1];
            console.log('searching for given term: ' + term);

            var message = "<a href=\"http://www.hascode.com/\">hasCode.com</a> blog articles for given term: <b>&quot;" + term + "&quot;</b>";
            options.path = basePath + term;
            var clientRequest = http.request(options, function (clientResponse) {
                var output = '';
                clientResponse.setEncoding('utf8');

                clientResponse.on('data', function (chunk) {
                    output += chunk;
                });

                clientResponse.on('end', function () {
                    var hits = JSON.parse(output);
                    var hitsNum = hits.length;
                    console.log(hitsNum + ' results for term ' + term + ' found, max-results set to: ' + maxResults);
                    message += ' (' + hitsNum + ' hit/s) <ul>';
                    message += hits.slice(0, maxResults).reduce(function (prev, cur) {
                        return createMessage(prev) + createMessage(cur);
                    }, "");
                    message += '</ul>';
                    if (hits.length > maxResults) {
                        message += '<b><a href="http://www.hascode.com/tag/' + term + '">Show all ' + hitsNum + ' results for &quot;' + term + '&quot;</a></b>'
                    }

                    hipchat.sendMessage(req.clientInfo, req.context.item.room.id, message)
                        .then(function (data) {
                            res.send(200);
                        });
                });
            });
            clientRequest.end();
        }
    );

    // Notify the room that the add-on was installed
    addon.on('installed', function (clientKey, clientInfo, req) {
        hipchat.sendMessage(clientInfo, req.body.roomId, 'The ' + addon.descriptor.name + ' add-on has been installed in this room');
    });

    // Clean up clients when uninstalled
    addon.on('uninstalled', function (id) {
        addon.settings.client.keys(id + ':*', function (err, rep) {
            rep.forEach(function (k) {
                addon.logger.info('Removing key:', k);
                addon.settings.client.del(k);
            });
        });
    });

    function createMessage(hit) {
        if (typeof hit === 'string') {
            return hit;
        }
        return '<li><a href=\"' + hit.url + '\">' + hit.title + '</a></li>';
    }
};