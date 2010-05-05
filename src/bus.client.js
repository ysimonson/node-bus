;(function(){
    function Bus(url){
        this.url = url;
    }
    Bus.prototype = {
        url: "",
        
        subscriptions: {},
        
        startup: function(){
            return this;
        },
        
        _hasSubscription: function(eventName, scope, callback, removeFlag){
            if(!this.subscriptions[eventName]){
                this.subscriptions[eventName] = [];
            }
            
            for(var i = 0, len = this.subscriptions[eventName].length; i < len; i++){
                var sub = this.subscriptions[eventName][i];
                
                if(sub.scope === scope && sub.callback === callback){
                    if(removeFlag === true){
                        this.subscriptions[eventName].splice(i, 1);
                        delete sub;
                    }
                    return true;
                }
            }
            return false;
        },
        
        _addSubscription: function(eventName, scope, callback){
            if(this._hasSubscription(eventName, scope, callback)){
                return false;
            }
            
            this.subscriptions[eventName].push({scope: scope, callback: callback});
            return true;
        },
        
        _removeSubscription: function(eventName, scope, callback){
            return this._hasSubscription(eventName, scope, callback, true);
        },
        
        subscribe: function(){
            var scope = window;
            var callback = null;
            var eventName = arguments[0];
            
            if(arguments.length == 2){
                callback = arguments[1];
            } else if (arguments.length == 3){
                scope = arguments[1];
                callback = arguments[2];
            } else {
                throw new Error("Bus.subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
            }
            
            return this._addSubscription(eventName, scope, callback);
        },
        sub: function(){ return this.subscribe.apply(this, Array.prototype.slice.call(arguments)); },
        
        unsubscribe: function(){
            var scope = window;
            var callback = null;
            var eventName = arguments[0];
            
            if(arguments.length == 2){
                callback = arguments[1];
            } else if (arguments.length == 3){
                scope = arguments[1];
                callback = arguments[2];
            } else {
                throw new Error("Bus.subscribe(..) requires two or three arguments: event name, [callback scope,] callback");
            }
            
            return this._removeSubscription(eventName, scope, callback);
        },
        unsub: function(){ return this.unsubscribe.apply(this, Array.prototype.slice.call(arguments)); },
        
        publish: function(){
        },
        pub: function pub(){ return this.publish.apply(this, Array.prototype.slice.call(arguments)); },
    };

    window.Bus = Bus;
})();