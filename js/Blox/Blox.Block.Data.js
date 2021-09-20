/**
 * A block that simply outputs data.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Block.Data = new Class({
    Extends: Blox.Block,

    serializable: 'Blox.Block.Data',

    initialize: function () {
        this.parent();

        this.parameters = { Data: null };
        this.outputs = ['Data'];
    },

	getBlockName: function () {
		return 'Data';
	},

    process: function (state) {
        this.output('Data', this.getParameter('Data'));
    }
});
