/**
 * A single particle in the physics engine. Has a position and a
 * velocity, but no mass or size.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Physics.Atom = new Class({
    serializable: 'Physics.Atom',

    meta: {},

    physics: null,
    group: null,

    x: NaN, ox: NaN,
    y: NaN, oy: NaN,

    mass: 1,
    radius: 0,

    initialize: function (x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    },

    collisions: function (cur, gravity) {
        for (var i = cur + 1; i < this.physics.atoms.length; i++) {
            var that = this.physics.atoms[i];
            var totRadius = this.radius + that.radius;

            if (totRadius == 0) continue;

            var dx = that.x - this.x, dy = that.y - this.y;
            var dist2 = dx * dx + dy * dy;
            var dist = Math.sqrt(dist2);

            if (dist < totRadius) {
                var diff = dist ? (dist - totRadius) / dist / 2 : 0.5;
                dx *= diff;
                dy *= diff;

                var m1 = that.mass / (this.mass + that.mass);
                var m2 = this.mass / (this.mass + that.mass);
                this.x += dx * m1;
                this.y += dy * m1;
                that.x -= dx * m2;
                that.y -= dy * m2;
            } else if (gravity) {
                var f = this._gmass * that.mass / dist2;

                var f1 = f / this.mass;
                var f2 = f / that.mass;
                this.x += dx * f1;
                this.y += dy * f1;
                that.x -= dx * f2;
                that.y -= dy * f2;
            }
        }
    },

    deserialize: function (o) {
        this.x = o.x; this.y = o.y;
        this.meta = o.m;
    },

    serialize: function () {
        return {
            x: this.x, y: this.y,
            m: this.meta
        };
    },

    setUp: function () {
        this._gmass = Physics.G * this.mass;
        this.ox = this.x;
        this.oy = this.y;
    },

    step: function (cur) {
        var tx = this.x, ty = this.y;

        if (this.mass > 0) {
            this.x += tx - this.ox + this.physics.gravityX * this._gmass;
            this.y += ty - this.oy + this.physics.gravityY * this._gmass;
        } else {
            this.x += tx - this.ox;
            this.y += ty - this.oy;
        }

        this.ox = tx;
        this.oy = ty;
    }
});
