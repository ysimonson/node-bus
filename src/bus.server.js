#!/usr/local/bin/node

var sys = require('sys'),
    comet = require('../lib/node-comet/src/comet.server'),
    events = require("events"),
    util = require("./util");
    
var RESERVED_EVENT_PREFIX = '__node-bus__';
    
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
    
    this.pubsub = new util.PubSubClient();
    this.clientSubscriptions = {};
    this.subscriptions = {};
    this.cometServer = new comet.CometServer(httpServer, pattern);
    //this.transformerEngine = new transformers.TransformerEngine();
    
    //Called when a message is received
    this._handleMessage = function(clientId, eventName, payload) {
        self.emit('receive', clientId, eventName, payload);
        
        if(eventName.substr(0, RESERVED_EVENT_PREFIX.length) == RESERVED_EVENT_PREFIX) {
            var specialEventName = eventName.substr(RESERVED_EVENT_PREFIX.length);
            
            if(specialEventName == '/listen') {
                self.emit('listen', clientId, payload);
            } else if(specialEventName == '/unlisten') {
                self.emit('unlisten', clientId, payload);
            }
        } else {
            var cometServer = self.cometServer;
            var clientContainer = self.subscriptions[eventName];

            if(clientContainer) {
                var message = {
                    name: eventName,
                    payload: payload
                };

                for(var subscribedClientId in clientContainer) {
                    cometServer.send(subscribedClientId, message);
                }
            }

            self.pubsub.fireEvent(eventName, payload);
        }
    };
    
    /*this.registerTransformer = function(transformer) {
        self.transformerEngine.register(transformer);
    };*/
    
    this.publish = function(eventName, payload) {
        this._handleMessage(-1, eventName, payload);
    };
    
    this.subscribe = function() {
        var results = self.pubsub.subscribe.apply(self.pubsub, arguments);
        return results.handle;
    };
    
    this.unsubscribe = function(handle) {
        // summary:
        //          Unsubscribes from an event.
        // handle: Object
        //          The object to unsubscribe.
        // return:
        //          Whether or not the unsubscribe action was successful.  
        //          If the function and scope were not found as a listener 
        //          to the event, false will be returned.
        
        var results = self.pubsub.unsubscribe(handle);
        return results.removed;
    };
    
    this.addListener('listen', function(clientId, eventName) {
        var container = self.subscriptions[eventName];
        if(!container) self.subscriptions[eventName] = container = [];
        
        var clientContainer = self.clientSubscriptions[clientId];
        if(!clientContainer) self.clientSubscriptions[clientId] = clientContainer = {};
        
        container[clientId] = null;
        clientContainer[eventName] = null;
    });

    this.addListener('unlisten', function(clientId, eventName) {
        var container = self.subscriptions[eventName];
        if(!container) self.subscriptions[eventName] = container = [];
        
        var clientContainer = self.clientSubscriptions[clientId];
        if(!clientContainer) self.clientSubscriptions[clientId] = clientContainer = {};
        
        delete container[clientId];
        delete clientContainer[eventName];
    });
    
    this.cometServer.addListener('connect', function(endpoint, clientId) {
        self.emit('connect', endpoint, clientId);
    });
    
    this.cometServer.addListener('close', function(endpoint, clientId) {
        self.emit('close', endpoint, clientId);
        
        var clientContainer = self.clientSubscriptions[clientId];
        
        if(clientContainer) {
            var subscriptions = self.subscriptions;
            
            for(var eventName in clientContainer) {
                var container = subscriptions[eventName];
                delete container[clientId];
            }
            
            delete self.clientSubscriptions[clientId];
        }
    });
    
    this.cometServer.addListener('receive', function(endpoint, clientId, json) {
        var eventName = json.name, eventPayload = json.payload;
        if(!eventName || !eventPayload) return;
        
        self._handleMessage(clientId, eventName, eventPayload);
    });
}

sys.inherits(BusServer, events.EventEmitter);
exports.BusServer = BusServer;