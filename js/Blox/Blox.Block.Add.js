/**
 * A block that adds two values together and outputs the result.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Block.Add = new Class({
    Extends: Blox.Block,

    serializable: 'Blox.Block.Add',

    initialize: function () {
        this.parent();

        this.inputs = ['Values'];
        this.outputs = ['Result'];
    },

	getBlockName: function () {
		return 'Add';
	},

    process: function (state) {
        if (this.hasValue('Values')) {
            var tot = this.popValue('Values');
            while (this.hasValue('Values')) tot += this.popValue('Values');
            this.output('Result', tot);
        }
    }
});
