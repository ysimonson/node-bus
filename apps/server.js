#!/usr/local/bin/node

var router = require('./lib/node-router');
var http = require('http');
var url = require('url');
var sys = require('sys');
var bus = require('../src/bus.server');

var NODEBUS_PATTERN = /\/nodebus/;

var dirHandler = router.staticDirHandler("static/", "", ["index.html"]);
var httpServer = http.createServer();
var busServer = new bus.BusServer(httpServer, NODEBUS_PATTERN);

httpServer.addListener('request', function (req, res) {
    if(req.method === "GET" && !NODEBUS_PATTERN.test(req.url)) {
        return dirHandler(req, res);
    }
});

busServer.addListener('connect', function(endpoint, clientId) {
    sys.puts('connect: ' + clientId);
});

busServer.addListener('close', function(endpoint, clientId) {
    sys.puts('close: ' + clientId);
});

busServer.addListener('receive', function(clientId, json) {
    sys.puts('receive: ' + clientId);
});

busServer.addListener('listen', function(clientId, eventName) {
    sys.puts('listen: ' + clientId + ': ' + eventName);
});

busServer.addListener('unlisten', function(clientId, eventName) {
    sys.puts('unlisten: ' + clientId + ': ' + eventName);
});

httpServer.listen(8080);