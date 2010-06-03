function hitch(obj, fn){
    // summary: 
    //          Binds a function to always execute within the specified scope.
    // obj: Object
    //          Scope that the function should always execute within.
    // fn: Function
    //          Function to bind.
    // returns: Function
    //          Bound function.
    return function(){
        return fn.apply(obj, Array.prototype.slice.call(arguments));
    };
}


exports.hitch = hitch;