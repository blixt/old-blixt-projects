/**
 * A framework for creating programs that take in data and then run it
 * through blocks that handle it and pass it on to one or more blocks.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

var Blox = new Class({
    Implements: EventModel,

    serializable: 'Blox',

    initialize: function () {
        this.blocks = [];
        this.meta = {};
        this.variables = {};
    },

    /**
     * Adds one or more blocks.
     * 
     * @param blocks Either an array of blocks or a list of blocks.
     */
    add: function () {
        var blocks = arguments[0] instanceof Array ? arguments[0] : arguments;

        for (var i = 0, l = blocks.length; i < l; i++) {
            if (this.blocks.contains(blocks[i])) continue;

            this.blocks.push(blocks[i]);
            blocks[i].addObserver(this);
        }
    },
    
    /**
     * An event method called by blocks that are being observed.
     */
    blockInput: function (block, subscription, value) {
        if (this.receivers.contains(block)) return;
        this.receivers.push(block);
    },
    
    /**
     * Deserializes a serialized version of the Blox class.
     * 
     * @param obj The serialized data.
     */
    deserialize: function (obj) {
        for (var i = 0, l = obj.b.length; i < l; i++) {
            this.add(obj.b[i]);
        }
        
        this.meta = obj.m;
        this.variables = obj.v;
    },
    
    getVariable: function (variable) {
        return this.variables[variable];
    },
    
    /**
     * Searches for any blocks that were processed in the last step that
     * may result in the specified block being processed.
     *
     * @param toBlock The block that possible incoming blocks should be
     *                returned for.
     * @return An array of blocks that may lead to the specified block.
     */
    incoming: function (toBlock) {
        var blocks = [];
        
        var scan = function (cur, find, checked) {
            if (!checked) checked = [];
            checked.push(cur);

            var s = cur.subscribers;
            for (var p in s) {
                for (var i = 0, l = s[p].length; i < l; i++) {
                    if (checked.contains(s[p][i])) continue;
                    if (s[p][i].subscriber == find || scan(s[p][i].subscriber, find, checked)) {
                        return true;
                    }
                }
            }
    
            return false;
        };


        var p = this.processing;
        for (var i = 0, l = p.length; i < l; i++) {
            if (p[i] == toBlock) continue;
            if (scan(p[i], toBlock)) blocks.push(p[i]);
        }
        
        return blocks;
    },
    
    /**
     * Removes a block.
     * 
     * @param block The block to remove
     */
    remove: function (block) {
        block.removeObserver(this);
        this.blocks.erase(block);
    },

    /**
     * Runs all blocks.
     */
    run: function () {
        this.variables = {};

        // Process blocks that are not subscribers first.
        this.receivers = [];
        for (var i = 0, l = this.blocks.length; i < l; i++) {
            var b = this.blocks[i];
            if (!b.isSubscriber()) this.receivers.push(b);
        }

        // Keep processing as long as outputs are being made.
        while (this.receivers.length > 0) {
            var r = this.processing = this.receivers;
            this.receivers = [];

            for (var i = 0, l = r.length; i < l; i++) {
                var state = { blox: this, waiting: false };

                r[i].process(state);

                // If a block is waiting for more input, don't clear its
                // values and queue it for processing in the next step.
                if (state.waiting) {
                    if (!this.receivers.contains(r[i])) this.receivers.push(r[i]);
                } else {
                    r[i].clearValues();
                }
            }
        }
    },

    /**
     * Serializes this Blox instance.
     * 
     * @return The serialized data for this Blox instance.
     */
    serialize: function () {
        return { b: this.blocks, m: this.meta, v: this.variables };
    },

    setVariable: function (variable, value) {
        this.variables[variable] = value;
    }
});
