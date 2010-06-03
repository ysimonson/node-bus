#!/usr/local/bin/node

var router = require('./lib/node-router');
var http = require('http');
var url = require('url');
var sys = require('sys');
var bus = require('../src/bus.server');

var dirHandler = router.staticDirHandler("../", "", ["index.html"]);

var server = http.createServer();
server.addListener('request', function (req, res) {

    // todo: this is messy, we need to figure out a more elegant way of doing 
    //  this.  doing bus.service here, and having the request handler in 
    //  bus.initialize below seems to cause requests to try to get handled 
    //  twice.
    // Also, if i dont put this here for the GET requests, to call service.. 
    //  it's like nothing gets called.
    if(req.method === "GET"){
        if((/\/nodebus/.test(req.url))){
            bus.service(req, res);
        } else {
            return dirHandler(req,res);
        }
    }
    
    return;
});

bus.initialize(server, /\/nodebus/);

server.listen(8080);