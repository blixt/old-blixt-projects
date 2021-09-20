/**
 * A simple event model.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

var EventModel = {
    observers: [],

    /**
     * Registers an object that will receive calls whenever an event
     * occurs.
     * 
     * @param observer The observer object.
     */
    addObserver: function (observer) {
        if (!this.observers.contains(observer)) {
            this.observers.push(observer);
        }
    },

    /**
     * Sends an event to all observers.
     * 
     * @param event The name of the method on the observers that will be
     *              called.
     * @param args A list of arguments that will be passed along with
     *             the event.
     */
    event: function (event) {
        var args = Array.prototype.slice.call(arguments, 0);
        args[0] = this;

        for (var i = 0, l = this.observers.length; i < l; i++) {
            var o = this.observers[i];
            if (typeof o[event] == 'function') {
                o[event].apply(o, args);
            }
        }
    },

    /**
     * Unregisters an observer from receiving notifications of events.
     *
     * @param observer The observer object.
     */
    removeObserver: function (observer) {
        this.observers.erase(observer);
    }
};
