var sys = require('sys'),
    events = require("events"),
    io = require('./socket.io');
    
var RESERVED_EVENT_PREFIX = '__node-bus__';
    
function BusServer(httpServer) {
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
    
    //handles executing callbacks when an event occurs
    this.pubsub = new PubSubClient();
    
    //mapping of client id => {event name => handle}
    this.clientSubscriptions = {};
    
    //the socket.io server
    this.socketServer = io.listen(httpServer);
    
    //performs transformations on events
    //this.transformerEngine = new transformers.TransformerEngine();
    
    //Called when a message is received
    this._handleMessage = function(client, eventName, payload) {
        self.emit('receive', client, eventName, payload);
        
        //if this is a special event...
        if(eventName.substr(0, RESERVED_EVENT_PREFIX.length) == RESERVED_EVENT_PREFIX) {
            var specialEventName = eventName.substr(RESERVED_EVENT_PREFIX.length);
            
            //emit listen and unlisten events
            if(specialEventName == '/listen') {
                self.emit('listen', client, payload);
            } else if(specialEventName == '/unlisten') {
                self.emit('unlisten', client, payload);
            }
        }
        
        //broadcast the message to everyone
        //TODO: optimize this so that it is only broadcast to listeners
        /*self.socketServer.broadcast(JSON.stringify({
            name: eventName,
            payload: payload
        }));*/
        
        self.pubsub.fireEvent(eventName, payload);
    };
    
    this._handleListen = function(client, eventName) {
        if(!client) return;
        //unlisten the client if it's somehow listening already
        self._handleUnlisten(client, eventName);
        
        var clientId = client.sessionId;
        var container = self.clientSubscriptions[clientId];
        if(!container) self.clientSubscriptions[clientId] = container = {};
        
        var subscription = self.pubsub.subscribe(eventName, function(payload) {
            client.send(JSON.stringify({
                name: eventName,
                payload: payload
            }));
        });
        
        container[eventName] = subscription.handle;
    };
    
    this._handleUnlisten = function(client, eventName) {
        if(!client) return;
        
        var container = self.clientSubscriptions[client.sessionId];
        if(!container) return;
        
        var handle = container[eventName];
        
        if(handle) {
            self.pubsub.unsubscribe(handle);
            delete container[eventName];
        }
    };
    
    this.publish = function(eventName, payload) {
        self._handleMessage(null, eventName, payload);
    };
    
    this.subscribe = function() {
        var results = self.pubsub.subscribe.apply(self.pubsub, arguments);
        return results.handle;
    };
    
    this.unsubscribe = function(handle) {
        var results = self.pubsub.unsubscribe(handle);
        return results.removed;
    };
    
    /*this.addTransformer = function(transformer) {
        this.transformerEngine.register(transformer);
    };
    
    this.removeTransformer = function(transformer) {
        this.transformerEngine.unregister(transformer);
    };*/
    
    this.addListener('listen', this._handleListen);
    this.addListener('unlisten', this._handleUnlisten);
    
    this.socketServer.addListener('connection', function(client) {
        client.addListener('message', function(message) {
            try {
                var json = JSON.parse(message);
            } catch(e) {
                return;
            }

            var eventName = json.name, eventPayload = json.payload;
            if(typeof(eventName) != 'string' || !eventPayload) return;

            self._handleMessage(client, eventName, eventPayload);
        });

        client.addListener('disconnect', function() {
            var container = self.clientSubscriptions[client.sessionId];
            if(!container) return;
            
            var pubsub = self.pubsub;

            for(var eventName in container) {
                var handle = container[eventName];
                pubsub.unsubscribe(handle);
            }
            
            delete self.clientSubscriptions[client.sessionId];
        });
    });
}

sys.inherits(BusServer, events.EventEmitter);
exports.BusServer = BusServer;