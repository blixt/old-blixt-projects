/**
 * A user interface for interacting with the Blox library graphically.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Ui = new Class({
    initialize: function (blox, container) {
        this.blox = blox;

        this.html = new Element('div', { 'class': 'blox-ui' })
            .inject(container || document.body);

        this.viewport = new Blox.Ui.HtmlViewport(this, this.html);
    }
});
