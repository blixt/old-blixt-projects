/**
 * A block that opens an alert box.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Block.Alert = new Class({
    Extends: Blox.Block,

    serializable: 'Blox.Block.Alert',

    initialize: function () {
        this.parent();

        this.inputs = ['Message'];
    },

	getBlockName: function () {
		return 'Alert';
	},

    process: function (state) {
        if (this.hasValue('Message')) {
            alert(this.popValue('Message'));
            this.output();
        }
    }
});
