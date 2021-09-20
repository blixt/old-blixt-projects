/**
 * A library for showing performers/activities on a timeline.
 * Depends on the date() function.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

var Timeline = new Class({
    initialize: function () {
        //this.offset = new Date().getTimezoneOffset() * 60000;
        this.range = 1209600000;
        this.scale = Timeline.TimeScale.days;
        this.updateFrequency = 1000;
    
        this.now = $time();
        this.performers = [];
        this.visible = false;
        
        this.html = {
            main: new Element('div', {
                events: {
                    mousedown: $lambda(false),
                    selectstart: $lambda(false)
                },
                styles: {
                    visible: false
                },
                'class': 'timeline'
            }).inject(document.body)
        };
        
        this.html.main.adopt(
            this.html.timeAxis = new Element('dl', { 'class': 'time-axis' }),
            this.html.performers = new Element('ul', { 'class': 'performers' }),
            new Element('div', { 'class': 'overlay' })
        );
        
        this.updateTimer = this.update.delay(this.updateFrequency, this);
    },
    
    addPerformer: function (performer) {
        if (performer.timeline == this) return;
        if (performer.timeline != null) performer.timeline.removePerformer(performer);
        
        this.html.performers.adopt(performer.html.main);
        
        performer.timeline = this;
        this.performers.push(performer);

        if (!performer.start) performer.start = this.now;
        performer.update();
    },
    
    removePerformer: function (performer) {
        this.performers.erase(performer);
        performer.timeline = null;
        performer.html.main.dispose();
    },
    
    setRange: function (range) {
        this.range = range;
        this.performers.each(function (p) { p.update() });
    },
    
    update: function  () {
        $clear(this.updateTimer);
        
        this.now = $time();
        
        this.html.timeAxis.empty();

        var x = this.now;
        var start = Math.floor(x / this.scale.step) * this.scale.step;
        var left = (start - x) / this.range;

        var major = null;
        for (var i = start; i < x + this.range; i += this.scale.step) {
            var curMajor = date(this.scale.majorFormat, i);
            if (major != curMajor) {
                var e = new Element('dt', {
                    styles: {
                        left: Math.max(left * 100, 0) + '%'
                    },
                    text: curMajor
                }).inject(this.html.timeAxis);
            }

            major = curMajor;

            var e = new Element('dd', {
                styles: {
                    left: Math.max(left * 100, 0) + '%'
                },
                text: date(this.scale.minorFormat, i)
            }).inject(this.html.timeAxis);

            left += this.scale.step / this.range;
        }
        
        this.performers.each(function (p) { p.update(); });
        
        if (!this.visible) {
            this.html.main.setStyle('visibility', 'visible');
            this.visible = true;
        }

        if (this.updateFrequency > 0) this.updateTimer = this.update.delay(this.updateFrequency, this);
    }
});

Timeline.rangeToString = function (range, maxPieces) {
    var result = '';

    var x = 0;
    for (var i = 0; i < Timeline.TimeUnits.length; i++) {
        var m = Timeline.TimeUnits[i].millisecs;
        if (range >= m) {
            if (maxPieces && x++ >= maxPieces) break;
            var a = Math.floor(range / m);
            result += (result ? ', ' : '') + a + ' ' + (a == 1 ? Timeline.TimeUnits[i].single : Timeline.TimeUnits[i].plural);
            range %= m;
        } else if (x > 0) {
            x++;
        }
    }

    return result;
};

Timeline.TimeScale = {
    seconds:  { step: 1000,
                minorFormat: 's',
                majorFormat: 'H:i' },

    minutes:  { step: 60000,
                minorFormat: 'i',
                majorFormat: 'H' },

    minutes2: { step: 60000,
                minorFormat: 'H:i',
                majorFormat: 'H' },

    quarters: { step: 900000,
                minorFormat: 'i',
                majorFormat: 'H' },

    hours:    { step: 3600000,
                minorFormat: 'H',
                majorFormat: 'l' },

    days:     { step: 86400000,
                minorFormat: 'jS',
                majorFormat: '\\w.W' },

    days2:    { step: 86400000,
                minorFormat: 'l',
                majorFormat: '\\W\\e\\e\\k W' },

    weeks:    { step: 604800000,
                minorFormat: '\\w.W',
                majorFormat: 'F' }
};

Timeline.TimeUnits = [
    { single: 'week',
      plural: 'weeks',
      millisecs: 604800000 },

    { single: 'day',
      plural: 'days',
      millisecs: 86400000 },

    { single: 'hour',
      plural: 'hours',
      millisecs: 3600000 },

    { single: 'minute',
      plural: 'minutes',
      millisecs: 60000 },

    { single: 'second',
      plural: 'seconds',
      millisecs: 1000 },

    { single: 'millisecond',
      plural: 'milliseconds',
      millisecs: 1 }
];
