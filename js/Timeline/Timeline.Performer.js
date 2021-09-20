/**
 * A performer that contains activities that are put on the timeline.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Timeline.Performer = new Class({
    initialize: function (title) {
        this.title = title;

        this.activities = [];
        this.idleTime = 0;
        this.start = null;

        this.html = { main: new Element('li', { 'class': 'performer' }) };
        this.html.main.adopt(
            this.html.title = new Element('span', { 'class': 'performer-title', text: title }),
            this.html.activities = new Element('ol', { styles: { width: '90%' }, 'class': 'activities' })
        );
    },

    addActivity: function (activity) {
        if (activity.performer == this) return;
        if (activity.performer != null) activity.performer.removeActivity(activity);

        activity.performer = this;
        activity.timeline = this.timeline;

        this.html.activities.adopt(activity.html.main);

        activity.position = this.activities.length;
        this.activities.push(activity);
        this.update(this.activities.length - 1);
    },

    removeActivity: function (activity) {
        var index = this.activities.indexOf(activity);
        if (index == -1) return;

        activity.html.main.dispose();
        this.activities.erase(activity);

        for (var i = index; i < this.activities.length; i++) {
            this.activities[i].position--;
        }

        activity.performer = null;
        activity.timeline = null;

        this.update(index);
    },

    setStart: function (time) {
        this.start = time;
        this.update();
    },

    update: function (startIndex) {
        if (this.activities.length == 0 || !this.timeline) return;

        var s = this.start || this.timeline.now;
        var ps = this.timeline.now, pr = this.timeline.range, pe = ps + pr;

        var va = 0;
        for (var i = startIndex || 0; i < this.activities.length; i++) {
            var a = this.activities[i], d = a.duration, e = s + d;

            if (e < ps || s > pe) {
                a.hide();
            } else {
                if (s < ps && !a.start) {
                    if (a.allowStart) {
                        a.html.main.addClass('started');
                        a.start = s;

                        if (this.idleTime) this.html.main.removeClass('idle');
                        this.idleTime = 0;
                    } else {
                        if (!this.idleTime) this.html.main.addClass('idle');
                        this.idleTime += ps - s;
                        this.start = s = ps;

                        e = s + d;
                    }
                }

                a.html.main.setStyle('width', (Math.min(e, pe) - Math.max(s, ps)) / pr * 99.8 + '%');
                if (i % 2) a.html.main.addClass('odd'); else a.html.main.removeClass('odd');
                a.show();
                
                va++;
            }

            s = e;
        }
        
        if (!va) {
            this.idleTime += ps - this.start;
            this.html.main.addClass('idle');
        }
    }
});
