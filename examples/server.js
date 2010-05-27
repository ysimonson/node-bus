#!/usr/local/bin/node

var router = require('./lib/node-router');
var http = require('http');
var url = require('url');
var sys = require('sys');
var io = require('../lib/Socket.IO-node/lib/socket.io');

var dirHandler = router.staticDirHandler("../", "", ["index.html"]);

var server = http.createServer().addListener('request', function (req, res) {
    dirHandler(req,res);
    return false;
});

server.listen(8080);
var listener = io.listen(server, {
    onClientMessage: function(message, client) {
        sys.puts('received: ' + message);
		listener.broadcast(message);
	}
});
