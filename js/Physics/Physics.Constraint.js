/**
 * Enforces the distance between two atoms. The distance can change
 * based on a sinus wave.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Physics.Constraint = new Class({
    serializable: 'Physics.Constraint',

    meta: {},

    physics: null,
    group: null,

    atom1: null,
    atom2: null,
    baseLength: NaN, // initial length (distance between atoms)

    strain: 0.0, // 0.0 = no strain, -1.0 = max pinch strain, infinity = max stretch strain
    targetLength: NaN, // length to enforce
    pinchStiffness: NaN, // readjust length by max(strain * x, -1.0) where x is the pinch stiffness and strain is less than zero
    stiffness: NaN,

    // Length variation (Sinus curve)
    minLength: NaN, maxLength: NaN,
    frequency: 0.0, // how much to progress the curve each step; 0.0 = no progress, 0.1 = progress 10%

    // Recalculated values
    _frequency: NaN,
    _position: NaN,

    initialize: function (atom1, atom2) {
        if (atom1 instanceof Physics.Atom) this.atom1 = atom1;
        if (atom2 instanceof Physics.Atom) this.atom2 = atom2;
    },

    deserialize: function (o) {
        this.atom1 = o.a1; this.atom2 = o.a2;
        this.minLength = o.l1; this.maxLength = o.l2;
        this.frequency = o.f;
        this.meta = o.m;
    },
    
    serialize: function () {
        return {
            a1: this.atom1, a2: this.atom2,
            l1: this.minLength, l2: this.maxLength,
            f: this.frequency,
            m: this.meta
        };
    },

    setUp: function () {
        if (!this.atom1 instanceof Physics.Atom || !this.atom2 instanceof Physics.Atom) {
            throw 'Physics.Constraint.setUp cannot be called before constraint has been assigned atoms.';
        }
        
        if (this.stiffness < 0 || this.stiffness >= 1) {
            throw 'Physics.Constraint.stiffness must be NaN or within range 0 < x < 1.';
        }

        var bl, dx = this.atom2.x - this.atom1.x, dy = this.atom2.y - this.atom1.y;
        this.baseLength = bl = Math.sqrt(dx * dx + dy * dy);

        var a, p, min = this.minLength || bl, max = this.maxLength || bl;

        if (min > max || min > bl || max < bl)
            throw 'Physics.Constraint.setMinMaxLengths must be called with values that satisfy min >= baseLength >= max.';

        this._amplitude = a = (max - min) / 2;
        this._position = p = Math.asin((bl - a - min) / a) || 0;
        this._frequency = this.frequency * Math.PI * 2;

        this.targetLength = min + a * (Math.sin(p) + 1);
    },

    step: function () {
        var tl, a = this._amplitude, f = this._frequency;
        if (a && f) {
            this._position += f;
            this.targetLength = tl = this.minLength + a * (Math.sin(this._position) + 1);
        } else {
            tl = this.targetLength;
        }

        var a1 = this.atom1, a2 = this.atom2;
        var dx = a2.x - a1.x, dy = a2.y - a1.y;

        var dist = Math.sqrt(dx * dx + dy * dy);
        var diff = dist ? (dist - tl) / dist / 3.0 : 0.5;
        if (this.stiffness) diff *= this.stiffness;

        dx *= diff;
        dy *= diff;

        if (!a1.fixed && a2.fixed) {
            a1.x += dx + dx;
            a1.y += dy + dy;
        } else if (a1.fixed && !a2.fixed) {
            a2.x -= dx + dx;
            a2.y -= dy + dy;
        } else if (!a1.fixed && !a2.fixed) {
            a1.x += dx;
            a1.y += dy;
            a2.x -= dx;
            a2.y -= dy;
        }
    }
});
