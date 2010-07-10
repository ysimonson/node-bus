#!/usr/local/bin/node

var sys = require('sys'),
    comet = require('../lib/node-comet/src/comet.server'),
    events = require("events");
    
function BusServer(httpServer, pattern) {
    // summary:
    //          Initialize the Bus system.
    // description:
    //          Sets up listeners for events on the httpServer object when they
    //          match the given pattern.
    // httpServer: http.Server
    //          Http Server object.
    // pattern: RegExp
    //          URL pattern to match.
    // returns: 
    //          Nothing.
    
    events.EventEmitter.call(this);
    var self = this;
    
    this.clientSubscriptions = {};
    this.subscriptions = {};
    this.cometServer = new comet.CometServer(httpServer, pattern);
    
    //Proxy the comet server events
    this.cometServer.addListener('connect', function(endpoint, clientId) {
        self.emit('connect', endpoint, clientId);
    });
    
    this.cometServer.addListener('close', function(endpoint, clientId) {
        self.emit('close', endpoint, clientId);
        
        var clientContainer = self.clientSubscriptions[clientId];
        if(clientContainer) {
            var subscriptions = self.subscriptions;
            
            for(var eventName in clientContainer) {
                self.emit('unlisten', clientId, eventName);
                var container = subscriptions[eventName];
                delete container[clientId];
            }
            
            delete self.clientSubscriptions[clientId];
        }
    });
    
    this.cometServer.addListener('receive', function(endpoint, clientId, json) {
        self._handleMessage(clientId, json);
    });
    
    //Called when a message is received
    this._handleMessage = function(clientId, json) {
        var eventName = json.name;
        if(!eventName) return;
        
        var container = self.subscriptions[eventName];
        if(!container) self.subscriptions[eventName] = container = {};
        
        if(json.type == 'listen' || json.type == 'unlisten') {
            self.emit(json.type, clientId, eventName);
            
            var clientContainer = self.clientSubscriptions[clientId];
            if(!clientContainer) self.clientSubscriptions[clientId] = clientContainer = {};
            
            if(json.type == 'listen') {
                container[clientId] = null;
                clientContainer[eventName] = null;
            } else {
                delete container[clientId];
                delete clientContainer[eventName];
            }
        } else {
            var eventPayload = json.payload;
            if(!eventPayload) return;
            
            self.emit('receive', clientId, json);
            var cometServer = self.cometServer;
            
            for(var subscribedClientId in container) {
                cometServer.send(subscribedClientId, json);
            }
        }
    };
}

sys.inherits(BusServer, events.EventEmitter);
exports.BusServer = BusServer;