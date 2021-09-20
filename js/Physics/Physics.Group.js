/**
 * A group of atoms and constraints.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Physics.Group = new Class({
    serializable: 'Physics.Group',

    meta: {},

    atoms: [],
    constraints: [],
    physics: null,

    add: function (object) {
        var type;
        if (object instanceof Physics.Atom) {
            type = 'atoms';
        } else if (object instanceof Physics.Constraint) {
            type = 'constraints';
        } else {
            throw 'Physics.Group.add requires either an instance of Physics.Atom or an instance of Physics.Constraint.'
        }

        if (this[type].contains(object)) return;
        if (object.group) object.group.remove(object);

        object.group = this;
        this[type].push(object);

        if (this.physics) {
            object.physics = this.physics;
            this.physics[type].push(object);
        }

        return object;
    },

    deserialize: function (o) {
        this.meta = o.m;
        
        for (var i = 0; i < o.a.length; i++) {
            this.add(o.a[i]);
        }
        
        for (var i = 0; i < o.c.length; i++) {
            this.add(o.c[i]);
        }
    },

    remove: function (object) {
        var type;
        if (object instanceof Physics.Atom) {
            type = 'atoms';
        } else if (object instanceof Physics.Constraint) {
            type = 'constraints';
        } else {
            throw 'Physics.Group.remove requires either an instance of Physics.Atom or an instance of Physics.Constraint.'
        }

        this[type].erase(object);
        object.group = null;
        
        if (this.physics) {
            this.physics[type].erase(object);
            object.physics = null;
        }
    },

    serialize: function () {
        return {
            m: this.meta,
            a: this.atoms,
            c: this.constraints
        };
    },

    setUp: function () {
    },

    step: function () {
    }
});
