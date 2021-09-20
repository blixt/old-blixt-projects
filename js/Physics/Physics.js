/**
 * A simple Verlet physics engine.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

var Physics = new Class({
    Implements: EventModel,

    serializable: 'Physics',

    meta: {},

    atoms: [],
    constraints: [],
    groups: [],

    boundaryX1: -500, boundaryX2: 500,
    boundaryY1: -500, boundaryY2: 500,

    gravityX: 0,
    gravityY: 0,

    add: function (group) {
        if (!group instanceof Physics.Group) throw 'Physics.add requires an instance of Physics.Group.';

        if (this.groups.contains(group)) return;
        if (group.physics) group.physics.remove(group);

        ['atoms', 'constraints'].each(function (type) {
            var collection = group[type];
            for (var i = 0, l = collection.length; i < l; i++) {
                collection[i].physics = this;
                if (!this[type].contains(collection[i])) {
                    this[type].push(collection[i]);
                }
            }
        }, this);
        
        group.physics = this;
        this.groups.push(group);
        
        return group;
    },

    deserialize: function (o) {
        this.boundaryX1 = o.bx1; this.boundaryX2 = o.bx2;
        this.boundaryY1 = o.by1; this.boundaryY2 = o.by2;

        this.gravityX = o.gx, this.gravityY = o.gy;

        this.meta = o.m;
        
        for (var i = 0; i < o.g.length; i++) {
            this.add(o.g[i]);
        }
    },

    remove: function (group) {
        if (!group instanceof Physics.Group) throw 'Physics.remove requires an instance of Physics.Group.';

        ['constraints', 'atoms'].each(function (type) {
            var collection = group[type];
            for (var i = 0, l = collection.length; i < l; i++) {
                this[type].erase(collection[i]);
                collection[i].physics = null;
            }
        }, this);

        this.groups.erase(group);
        group.physics = null;
    },

    serialize: function () {
        return {
            bx1: this.boundaryX1, bx2: this.boundaryX2,
            by1: this.boundaryY1, by2: this.boundaryY2,
            gx: this.gravityX, gy: this.gravityY,
            m: this.meta,
            g: this.groups
        };
    },

    setUp: function () {
        ['atoms', 'constraints', 'groups'].each(function (type) {
            var collection = this[type];
            for (var i = 0, l = collection.length; i < l; i++) {
                collection[i].setUp();
            }
        }, this);
    },

    step: function () {
        ['constraints', 'atoms', 'groups'].each(function (type) {
            var collection = this[type];
            for (var i = 0, l = collection.length; i < l; i++) {
                collection[i].step(i);
            }
        }, this);

        for (var i = 0; i < 3; i++)
            for (var j = 0; j < this.atoms.length; j++)
                this.atoms[j].collisions(j, i == 0);

        this.event('step');
    }
});

Physics.G = 6.67 * Math.pow(10, -11);
