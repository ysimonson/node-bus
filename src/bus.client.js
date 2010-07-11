;(function(){
    function Bus(busUrl) {
        this.comet = comet(busUrl);
        var self = this;
        
        this.comet.onmessage = function(json) {
            self._fireEvent(json.name, json.payload);
        };
        
        this.comet.onerror = function(name, message) {
            if(console.log) {
                console.log("node-comet error: " + name + ": " + message);
            }
        };
    };
    
    Bus.prototype = {
        // subscriptions: Object
        //          Map of event names to arrays of callback function/scope 
        //          pairs.
        subscriptions: {},
        
        _fireEvent: function(eventName, payload){
            // summary:
            //          Fire off the event to the listeners.
            // eventName:
            //          Name of the event.
            // args: Array
            //          The arguments to send to subscribers.
            var container = this.subscriptions[eventName];
            
            if(container) {
                for(var i = 0, len = container.length; i < len; i++){
                    var sub = container[i];
                    
                    //Call wrapped in a setTimeout to provide "cooperative
                    //multitasking" - the callback's execution will be delayed
                    //if there are other things the browser wants to respond
                    //to right now
                    setTimeout(function() {
                        sub[1].apply(sub[0], [payload]);
                    }, 0);
                }
            }
        },
        
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
            //          Whether or not the subscription was made.
            var scope = window;
            var callback = null;
            
            //Find what kind of arguments we're dealing with
            if(arguments.length == 2){
                callback = arguments[1];
            } else if (arguments.length == 3){
                scope = arguments[1];
                callback = arguments[2];
            } else {
                throw new Error("Bus.subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
            }
            
            //Get the container for the event
            var container = this.subscriptions[eventName];
            
            //Create a container if one doesn't exist
            if(!container) {
                this.subscriptions[eventName] = container = [];
                
                //This is the first callback associated with the event; notify
                //the server
                this.comet.send({
                    type: 'listen',
                    name: eventName
                });
            }
            
            //Add the listener to the container and return it to allow for
            //future unsubscriptions
            var callee = [scope, callback];
            container.push(callee);
            return {eventName: eventName, callee: callee};
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
            
            //Find the container for the subscription
            var container = this.subscriptions[handle.eventName];
            if(!container) return false;
            
            //What to search for in the container
            var callee = handle.callee;
            
            for(var i=0, len=container.length; i<len; i++) {
                var item = container[i];
                
                //If the item is found...
                if(item === callee) {
                    //Cut it out
                    container.splice(i, 1);
                    
                    if(container.length == 0) {
                        //There are no callbacks listening to this event; notify
                        //the server
                        this.comet.send({
                            type: 'unlisten',
                            name: handle.eventName
                        });
                    
                        //Perform a hard-core delete to prevent memory leaks
                        delete this.subscriptions[handle.eventName];
                    }
                    
                    delete item;
                    return true;
                }
            }
                
            return false;
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
        
        // Shortcut function for subscribe.
        sub: function(){ return this.subscribe.apply(this, Array.prototype.slice.call(arguments)); },
        // Shortcut function for unsubscribe.
        unsub: function(){ return this.unsubscribe.apply(this, Array.prototype.slice.call(arguments)); },
        // Shortcut function for publish.
        pub: function pub(){ return this.publish.apply(this, Array.prototype.slice.call(arguments)); }
    };

    window.Bus = Bus;
})();
