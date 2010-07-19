;(function(){
    function Bus(busUrl) {
        this.comet = comet(busUrl);
        this.pubsub = new PubSubClient();
        var self = this;
        
        this.comet.onmessage = function(json) {
            self.pubsub.fireEvent(json.name, json.payload);
        };
        
        this.comet.onerror = function(name, message) {
            if(console.log) {
                console.log("node-comet error: " + name + ": " + message);
            }
        };
    };
    
    Bus.prototype = {
        // comet: Object
        //          Instance of the node-comet connection.
        comet: null,
        
        // pubsub: Object
        //          Instance of the pubsub client.
        pubsub: null,
        
        // transformers: Object
        //          Instance of the transformation engine. 
        transformers: new TransformerEngine(),
        
        subscribe: function(eventName /*, scope (optional), callback*/){
            // summary:
            //          Subscribes to an event when given a callback and an
            //          optional scope for the callback.
            // eventName: String
            //          Name of the event.
            // scope: Object (Optional)
            //          Calling-scope of the listener callback.
            // callback: Function
            //          Function that is listening for the eventName event.
            // return: 
            //          The subscription handle.
            var results = this.pubsub.subscribe.apply(this.pubsub, arguments);
            
            if(results.isFirstSubscription) {
                this.publish('__node-bus__/listen', eventName);
            }
            
            return results.handle;
        },
        
        unsubscribe: function(handle){
            // summary:
            //          Unsubscribes from an event.
            // handle: Object
            //          The object to unsubscribe.
            // return:
            //          Whether or not the unsubscribe action was successful.  
            //          If the function and scope were not found as a listener 
            //          to the event, false will be returned.
            
            var results = this.pubsub.unsubscribe(handle);
            
            if(results.isLastSubscription) {
                this.publish('__node-bus__/unlisten', eventName);
            }
            
            return results.removed;
        },
        
        publish: function(eventName, payload){
            // summary:
            //          Publishes an event.
            // eventName:
            //          Name of the event.
            // payload:
            //          Information for the event. For example, this could be 
            //          the information that goes along with a click event: 
            //          target, x/y coordinates, etc.
            
            this.comet.send({
                name: eventName,
                payload: payload
            });
        },
        
        sub: function() { return this.subscribe.apply(this, arguments); },
        unsub: function() { return this.unsubscribe.apply(this, arguments); },
        pub: function() { return this.publish.apply(this, arguments); }
    };
    
    this.Bus = Bus;
})(window);
