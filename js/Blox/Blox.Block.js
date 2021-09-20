/**
 * A block that handles input data and returns output data.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Block = new Class({
    Implements: EventModel,

    serializable: 'Blox.Block',

    initialize: function () {
        this.subscribers = {};
        this.subscriptions = {};

        this.meta = {};
        this.parameters = {};
        this.inputs = ['In'];
        this.outputs = ['Out'];

        this.values = {};
    },

    /**
     * Clears the input values of the block.
     */
    clearValues: function () {
        this.values = {};
    },

    deserialize: function (obj) {
        for (var i in obj.v) this.setParameter(i, obj.v[i]);

        for (var output in obj.s) {
            var ss = obj.s[output];
            for (var i = 0, l = ss.length; i < l; i++) {
                var s = ss[i];
                this.publish(output, s.s, s.i);
            }
        }
        
        this.meta = obj.m;
    },

    /**
     * Gets the name of this type of block.
     * 
     * @return The block type.
     */
	getBlockName: function () {
		return 'Block';
	},

    /**
     * Retrieves the value of a parameter.
     * 
     * @param param The parameter to retrieve.
     * @return The value of the parameter.
     */
    getParameter: function (param) {
        if (this.parameters[param] === undefined)
            throw 'Could not set parameter: Invalid parameter.';

        return this.parameters[param];
    },

    /**
     * Checks whether an input has one or more values.
     * 
     * @param input The input to check.
     * @return true if the input has a value; otherwise, false.
     */
    hasValue: function (input) {
        if (!this.inputs.contains(input))
            throw 'Could not test if input has value: Invalid input.';

        return this.values[input] && this.values[input].length > 0;
    },

    /**
     * Notifies the block of a received input.
     * 
     * @param subscription The object that represents the subscription
     *                     between this block and its publisher.
     * @param value The incoming value.
     */
    input: function (subscription, value) {
        if (subscription.subscriber != this)
            throw 'Could not handle input: Subscriber mismatch.';

        if (!this.inputs.contains(subscription.input))
            throw 'Could not handle input: Invalid input.';

        this.event('blockInput', subscription, value);

        this.pushValue(subscription.input, value);
    },

    /**
     * Checks whether this block is a subscriber.
     * 
     * @param publisher (optional) Only return true if the block is a
     *                  subscriber of this publisher.
     * @param output (optional) Only return true if the block is
     *               subscribing to this output.
     * @return true if the block is a subscriber; otherwise, false.
     */
    isSubscriber: function (publisher, output) {
        for (var i in this.subscriptions) {
            if (publisher) {
                var s = this.subscriptions[i];
                if (s.publisher != publisher) continue;
                if (output && s.output != output) continue;
            }
            
            return true;
        }
        
        return false;
    },

    /**
     * Sends a value to all subscribers of the specified output.
     * 
     * @param output The output to send the value through.
     * @param value The value to send.
     */
    output: function (output, value) {
        if (!output) output = 'Out';

        if (!this.outputs.contains(output))
            throw 'Could not output: Invalid output.';

        this.event('blockOutput', output, value);

        if (!this.subscribers[output]) return;
        for (var i = 0, l = this.subscribers[output].length; i < l; i++) {
            var s = this.subscribers[output][i];
            s.subscriber.input(s, value);
        }
    },

    /**
     * Gets the next value in the specified input without removing it.
     * 
     * @param input The input to retrieve the value from.
     * @return The value or undefined if no value was available.
     */
    peekValue: function (input) {
        if (!this.inputs.contains(input))
            throw 'Could not get input value: Invalid input.';

        var i = this.values[input];
        return i && i.length > 0 ? i[i.length - 1] : undefined;
    },

    /**
     * Gets the next value in the specified input and removes it.
     * 
     * @param input The input to retrieve the value from.
     * @return The value or undefined if no value was available.
     */
    popValue: function (input) {
        if (!this.inputs.contains(input))
            throw 'Could not get input value: Invalid input.';

        var i = this.values[input];
        return i && i.length > 0 ? i.pop() : undefined;
    },

    /**
     * Process this block.
     */
    process: function (state) {
        if (this.hasValue('In')) {
            this.output('Out', this.popValue('In'));
        }
    },

    publish: function (output, block, input) {
        block.subscribe(input, this, output);
    },

    pushValue: function (input, value) {
        if (!this.inputs.contains(input))
            throw 'Could not set input value: Invalid input.';

        if (this.values[input]) this.values[input].push(value);
        else this.values[input] = [value];
    },

    serialize: function () {
        var subscribers = {};
        for (var i in this.subscribers) {
            subscribers[i] = [];
            for (var ss = this.subscribers[i], l = ss.length, j = 0; j < l; j++) {
                subscribers[i].push({ s: ss[j].subscriber, i: ss[j].input });
            }
        }

        return {
            v: this.parameters,
            s: subscribers,
            m: this.meta
        };
    },

    setParameter: function (param, value) {
        if (this.parameters[param] === undefined)
            throw 'Could not set parameter: Invalid parameter.';

        this.parameters[param] = value;
    },

    // TODO: The order in which outputs are sent to an input needs to
    //       be customizable as it might affect the end result in some
    //       blocks.
    subscribe: function (input, block, output) {
        if (!this.inputs.contains(input))
            throw 'Could not subscribe: Invalid input.';

        if (!block.outputs.contains(output))
            throw 'Could not subscribe: Invalid output.';

        if (this.isSubscriber(block, output)) return;

        var subscription = {
            publisher: block,
            output: output,
            subscriber: this,
            input: input
        };

        if (this.subscriptions[input]) {
            this.subscriptions[input].push(subscription);
        } else {
            this.subscriptions[input] = [subscription];
        }

        if (block.subscribers[output]) {
            block.subscribers[output].push(subscription);
        } else {
            block.subscribers[output] = [subscription];
        }
    },
    
    unsubscribe: function (input, block, output) {
        if (!this.subscriptions[input]) return;

        var ss = this.subscriptions[input];
        for (var l = ss.length, i = l - 1; i >= 0; i--) {
            var s = ss[i], ps = s.publisher.subscribers;

            if (block && s.publisher != block && (output && s.output != output)) continue;

            for (var j = 0, m = ps.length; j < m; j++) {
                if (ps[j] == s) {
                    ps.splice(j, 1);
                    break;
                }
            }

            ss.splice(i, 1);
        }
        
        
        var s = this.subscriptions[input], ss = s.publisher.subscribers;
        for (var i = 0, l = ss.length; i < l; i++) {
            if (ss[i] == s) {
                delete ss[i];
                break;
            }
        }

        delete this.subscriptions[input];
    }
});
