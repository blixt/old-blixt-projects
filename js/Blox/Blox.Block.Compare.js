/**
 * Compares value pairs and outputs the value in the 'Values' input to
 * the appropiate output.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Block.Compare = new Class({
    Extends: Blox.Block,

    serializable: 'Blox.Block.Compare',

    initialize: function () {
        this.parent();

        this.inputs = ['Values', 'Compare to'];
        this.outputs = ['Less than', 'Equal to', 'Greater than'];
    },

	getBlockName: function () {
		return 'Compare';
	},

    process: function (state) {
        while (this.hasValue('Values') && this.hasValue('Compare to')) {
            var v1 = this.popValue('Values'), v2 = this.popValue('Compare to');

            if (v1 < v2)
                this.output('Less than', v1);
            else
                if (v1 > v2) this.output('Greater than', v1);
            else
                this.output('Equal to', v1);
        }
        
        if (this.hasValue('Values') || this.hasValue('Compare to')) {
            if (state.blox.incoming(this).length > 0) state.waiting = true;
        }
    }
});
