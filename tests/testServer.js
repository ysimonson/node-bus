#!/usr/local/bin/node

var router = require('./lib/node-router');
var bus = require('../src/bus.server');

var http = require('http');
var url = require('url');
var sys = require('sys');

var dirHandler = router.staticDirHandler("../", "", ["index.html"]);

http.createServer().addListener('request', function (req, res) {
    var urlobj = url.parse(req.url);
    
    sys.puts(req.method+" "+req.url);
    
    var eventPattern = /^\/events/;
    
    if(eventPattern.test(urlobj.pathname)){
        bus.service(req,res);
    } else {
        dirHandler(req,res);
    }
    return false;
}).listen(8080);
sys.puts('Server running at http://127.0.0.1:8080/');
