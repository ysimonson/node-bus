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
    subscriptions: {},
    subscriberIndex: {},
    
    addListener: function(event, client) {
        var indexContainer = this.subscriberIndex[client.sessionId];
        if(!indexContainer) this.subscriberIndex[client.sessionId] = indexContainer = {};
        if(indexContainer[event] != undefined) return false;
        
        var container = this.subscriptions[event];
        if(!container) this.subscriptions[event] = container = [];
        container.push(client);
        
        indexContainer[event] = container.length - 1;
        return true;
    },
    
    removeListener: function(event, client) {
        #bug caused by indices going stale
        var indexContainer = this.subscriberIndex[client.sessionId];
        if(!indexContainer) return false;
        
        var index = indexContainer[event];
        if(index == undefined) return false;
        
        var container = this.subscriptions[event];
        if(!container) return false;
        
        container.splice(index, 1);
        if(container.length == 0) delete this.subscriptions[event];
        
        delete this.indexContainer[event];
        if(indexContainer.length == 0) delete this.subscriberIndex[client.sessionId];
        
        return true;
    },
    
    onClientMessage: function(message, client) {
        var json = null;
        try {
            json = JSON.parse(message);
            sys.puts('received: ' + message);
        } catch(e) {
            //TODO: give an error message
            return;
        }
        
        if(json instanceof Array) {
            var container = this.subscriptions[json[0]];
            for(var subscribers in container) {
                subscribers.send(json);
            }
        } else if(typeof json == 'object') {
            var messageType = json['type'];
            
            if(messageType == 'listen') {
                this.addListener(json['event'], client);
            } else if(messageType == 'unlisten') {
                this.removeListener(json['event'], client);
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
