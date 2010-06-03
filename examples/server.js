#!/usr/local/bin/node

var router = require('./lib/node-router');
var http = require('http');
var url = require('url');
var sys = require('sys');
var io = require('../lib/Socket.IO-node/lib/socket.io');
var bus = require('../src/bus.server');

var dirHandler = router.staticDirHandler("../", "", ["index.html"]);

var server = http.createServer();
server.addListener('request', function (req, res) {
    if((/\/nodebus/.test(req.url))){
        bus.service(req, res);
    } else {
        return dirHandler(req,res);
    }
    return;
});

bus.initialize(server, /\/nodebus/);

server.listen(8080);

/*
var listener = io.listen(server, {
    onClientMessage: function(message, client) {
        sys.puts('received: ' + message);
        listener.broadcast(message);
    }
});
*/