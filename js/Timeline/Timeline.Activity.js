/**
 * A single activity on the timeline.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Timeline.Activity = new Class({
    initialize: function (title, duration) {
        this.allowStart = true;
        this.duration = duration;
        this.performer = null;
        this.timeline = null;
        this.start = null;
        this.visible = true;

        this.title = title;

        this.html = {
            main: new Element('li', { 'class': 'activity' })
        };

        this.html.main.adopt(
            new Element('div', { 'class': 'title' }).adopt(
                this.html.title = new Element('a', {
                    events: { click: $lambda(false) },
                    href: '#',
                    text: title
                })
            ),
            new Element('div', { 'class': 'status' })
        );

        for (var e in this.events) {
            this.html.main.addEvent(e, this.events[e].bindWithEvent(this));
        }
    },

    events: {
        click: function (e) {
            if (e.rightClick) this.html.main.fireEvent('contextmenu');
            e.preventDefault();
            
            this.allowStart = true;
        },

        mousedown: function (e) {
            e.preventDefault();
        },

        selectstart: function (e) {
            e.stop();
        }
    },

    hide: function () {
        if (!this.visible) return;

        this.html.main.dispose();
        this.visible = false;
    },

    show: function () {
        if (this.visible) return;

        this.visible = true;
        
        var as = this.performer.activities;
        
        for (var i = this.position - 1; i >= 0; i--) {
            if (as[i].visible) {
                this.html.main.inject(as[i].html.main, 'after');
                return;
            }
        }
        
        for (var i = this.position + 1; i < as.length; i++) {
            if (as[i].visible) {
                this.html.main.inject(as[i].html.main, 'before');
                return;
            }
        }
        
        this.html.main.inject(this.performer.html.activities);
    }
});
