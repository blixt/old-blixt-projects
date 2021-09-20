/**
 * Handles serialization and deserialization of objects, preserving
 * reference integrity. Ideal for storing a complex data structure as
 * JSON. 
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

var ObjectManager = function (dataVersion) {
    this.dataVersion = dataVersion || '';
    this.objects = {};
};

ObjectManager.version = '1.0';

ObjectManager.prototype = {
    /**
     * Gets the id of an object.
     * 
     * @param object The object to find the id for.
     * @return The id of the object or false if the object has not been registered. 
     */
    getId: function (object) {
        for (var id in this.objects) {
            if (this.objects[id] == object) return id;
        }

        return false;
    },

    /**
     * Callback for the ObjectManager.deepCopy function.
     * Replaces object reference representations with actual references.
     */
    parseReferences: function (value, key) {
        if (value && typeof value == 'object' && value['$']) {
            return [this.objects[value['$']]];
        }
    },

    /**
     * Registers an object for serialization.
     * 
     * @param object The object to register.
     * @param id (optional) The id that the object should be registered with.
     * @return The id that the object was registered with or false if registration failed. 
     */
    register: function (object, id) {
        if (!object || typeof object != 'object') return false;

        // Handle cases where the object has already been registered.
        var tempId;
        if (tempId = this.getId(object)) {
            // If no id was specified, just return the id the object
            // already has.
            if (!id) return tempId;

            // If an id was specified, unregister the object and then
            // continue registration.
            this.unregister(object);
        }

        // Generate a unique numeric id if no id was specified.
        if (!id) {
            tempId = 0;
            while (this.objects[++tempId]) { }
            id = tempId;
        }

        id = String(id);

        this.objects[id] = object;
        return id;
    },

    /**
     * Callback for the ObjectManager.deepCopy function.
     * Replaces object references with reference representations.
     */
    replaceReferences: function (value, key) {
        // Ignore the 'serializable' property of objects.
        if (key == 'serializable') return false;
        if (value && typeof value == 'object') {
            // Make sure the object is registered and get its id.
            var id = this.getId(value);
            if (!id) id = this.register(value);

            // References are represented as an object with a single
            // property, '$', that has the id as its value.
            return [{ '$': id }];
        }
    },

    /**
     * Serializes all the registered objects.
     * 
     * @return An object with the serialized data.
     */
    serialize: function () {
        var result = {
            v: ObjectManager.version,
            w: this.dataVersion,
            o: {}
        };

        // Since the objects collection may expand during the for-loop,
        // it will need to be run again as long as there were changes to
        // it.
        var moreObjects = true;
        while (moreObjects) {
            moreObjects = false;

            for (var id in this.objects) {
                // If an object has already been processed, skip to the
                // next one.
                if (result.o[id]) continue;

                // Since an object is being processed, that means the
                // objects collection may have changed.
                moreObjects = true;

                var o = this.objects[id];
                if (o.serializable) {
                    result.o[id] = {
                        t: o.serializable,
                        o: ObjectManager.deepCopy(o.serialize ? o.serialize(this) : o, this.replaceReferences, this)
                    };
                } else {
                    result.o[id] = { o: ObjectManager.deepCopy(o, this.replaceReferences, this) };
                }
            }
        }

        return result;
    },

    /**
     * Unregisters an object.
     * 
     * @param object The object to unregister, or its id.
     */
    unregister: function (object) {
        // Attempt to treat the argument as an id.
        if (this.objects[object]) {
            delete this.objects[object];
            return;
        }

        // Scan the objects collection for the object.
        for (var id in this.objects) {
            if (this.objects[id] == object) {
                delete this.objects[id];
            }
        }
    }
};

/**
 * Performs a deep copy of an object. Function references will be skipped.
 *
 * The function does not detect recursive referencing, this needs to be
 * handled by the item callback.
 *
 * If the item callback has a return value, the item will be ignored. If
 * the return value is an array, the first item in that array will replace
 * the item instead.
 *
 * @param object The object that will be copied.
 * @param itemCallback (optional) A function that will be called for each
 *                     item in the object. The function will be passed with
 *                     two arguments: the item and its key.
 * @param bind (optional) The object that will represent 'this' in the
 *             item callback function.
 * @return A deep copy of the given object.
 */
ObjectManager.deepCopy = function (object, itemCallback, bind) {
    if (!object || typeof object != 'object') return object;

    var result,
        handleItem = function (key) {
            if (key[0] == '_') return;
            var item = object[key];

            if (typeof itemCallback == 'function') {
                var r = bind ? itemCallback.call(bind, item, key) : itemCallback(item, key);
                if (r !== undefined) {
                    if (r instanceof Array && r.length > 0) result[key] = r[0];
                    return;
                }
            }

            var p = ObjectManager.deepCopy(item, itemCallback, bind);
            if (typeof p != 'function') result[key] = p;
        };

    if (object instanceof Array) {
        result = [];
        for (var i = 0; i < object.length; i++) handleItem(i);
    } else {
        result = {};
        for (var i in object) handleItem(i);
    }

    return result;
};

/**
 * A collection of deserializers for each data structure version.
 */
ObjectManager.deserializers = {
    '1.0': function (o) {
        var manager = new ObjectManager(o.w);

        // First pass.
        // Creates empty instances for each object, so that they may be
        // referenced in the second pass.
        for (var id in o.o) {
            var data = o.o[id];

            var object;
            if (data.t) {
                var type = window;
                var path = data.t.split('.');
                for (var i = 0; i < path.length; i++) {
                    type = type[path[i]];
                    if (!type) throw 'Could not deserialize object (undefined type.)';
                }

                object = new type();
            } else {
                object = data.o instanceof Array ? [] : {};
            }

            manager.register(object, id);
        }

        // Create a temporary collection that will hold copies for de-
        // serialization methods, which are run in a third pass because
        // they need all references to have been expanded by the second
        // pass first.
        var copyCache = {};

        // Second pass.
        // Expands all references to other objects and fills objects
        // that don't have custom deserialization routines.
        for (var id in o.o) {
            var data = o.o[id];
            var object = manager.objects[id];

            var copy = ObjectManager.deepCopy(data.o, manager.parseReferences, manager);
            if (data.t && object.deserialize) {
                copyCache[id] = copy;
            } else {
                if (copy instanceof Array) {
                    for (var i = 0; i < copy.length; i++) {
                        object[i] = copy[i];
                    }
                } else {
                    for (var i in copy) {
                        object[i] = copy[i];
                    }
                }
            }
        }

        // Third pass.
        // Calls custom deserialization methods.
        for (var id in copyCache) {
            manager.objects[id].deserialize(copyCache[id], manager);
        }

        return manager;
    }
};

/**
 * Deserializes serialized data.
 * 
 * @param object The object with the serialized data. 
 * @return An instance of ObjectManager with the same structure as the
 *         ObjectManager that was serialized.
 */
ObjectManager.deserialize = function (object) {
    if (!object || !ObjectManager.deserializers[object.v]) {
        throw 'Could not deserialize object (unsupported object.)';
    }
    
    return ObjectManager.deserializers[object.v](object);
};
