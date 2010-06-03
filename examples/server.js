#!/usr/local/bin/node

var router = require('./lib/node-router');
var http = require('http');
var url = require('url');
var sys = require('sys');
var io = require('../lib/Socket.IO-node/socket.io');

var dirHandler = router.staticDirHandler("../", "", ["index.html"]);

var server = http.createServer().addListener('request', function (req, res) {
    dirHandler(req,res);
    return false;
});

server.listen(8080);

var listener = io.listen(server, {
    onClientMessage: function(message, client) {
        var json = null;
        try {
            sys.puts('received: ' + message);
            json = JSON.parse(message);
        } catch(e) {
            //TODO: give an error message
            sys.puts('error');
            return;
        }
        
        if(json instanceof Array) {
            listener.broadcast(message);
        } else if(typeof json == 'object') {
            var messageType = json['type'];
            
            if(messageType == 'listen') {
                //TODO
            } else if(messageType == 'unlisten') {
                //TODO
            } else {
                //TODO: given an error message
                return;
            }
        } else {
            //TODO: give an error message
            return;
        }
    }
});
