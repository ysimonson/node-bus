function TransformerEngine() {
    this.transformers = [];
    
    this.process = function(obj) {
        var transformers = this.transformers;
        
        for(var i=0, len=transformers.length; i<len; i++) {
            var result = transformers[i](obj);
            if(!result) return null;
            obj = result;
        }
        
        return obj;
    };
    
    this.register = function(transformer) {
        this.transformers.append(transformer);
    };
}

function PubSubClient() {
    this.subscriptions = {};
    this.lastHandleId = 0;
    
    this.subscribe = function(eventName /*, scope (optional), callback*/) {
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
        
        var scope = this;
        var callback = null;

        //Find what kind of arguments we're dealing with
        if(arguments.length == 3){
            scope = arguments[1];
            callback = arguments[2];
        } else if (arguments.length == 2){
            callback = arguments[1];
        } else {
            throw new Error("subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
        }

        //Get the container for the event
        var container = this.subscriptions[eventName];
        var isFirstSubscription = false;

        //Create a container if one doesn't exist
        if(!container) {
            //This is the first callback associated with the event; notify
            //the server
            this.subscriptions[eventName] = container = {};
            isFirstSubscription = true;
        }

        //Add the listener to the container and return it to allow for
        //future unsubscriptions
        var handleId = this.lastHandleId++;
        container[handleId] = [scope, callback];

        return {
            isFirstSubscription: isFirstSubscription,
            handle: {eventName: eventName, handleId: handleId}
        };
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
        
        //Find the container for the subscription
        var results = {
            isLastSubscription: false,
            removed: false
        };

        var container = this.subscriptions[handle.eventName];
        if(!container) return results;
        
        if(handle.handleId in container) {
            delete container[handle.handleId];
            
            results.removed = true;
            results.isLastSubscription = true;
            
            for(var key in container) {
                results.isLastSubscription = false;
                break;
            }
        }
        
        return results;
    };
    
    this.fireEvent = function(eventName, payload) {
        var container = this.subscriptions[eventName];
        var payload = [payload];

        if(container) {
            for(var key in container) { 
                var value = container[key];
                
                //Call wrapped in a setTimeout to provide "cooperative
                //multitasking" - the callback's execution will be delayed
                //if there are other things the browser wants to respond
                //to right now
                setTimeout(function() {
                    value[1].apply(value[0], payload);
                }, 0);
            }
        }
    };
}

//Try to export the public members for node.js. This will fail in a browser
//environment, so wrap it in a try/catch.
try {
    exports.TransformerEngine = TransformerEngine;
    exports.PubSubClient = PubSubClient;
} catch(e) {}