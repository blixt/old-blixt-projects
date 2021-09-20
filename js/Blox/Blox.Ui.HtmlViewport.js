/**
 * A viewport that represents the blocks as HTML.
 * 
 * Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
 * License: MIT license <http://www.opensource.org/licenses/mit-license.php>
 * Project homepage: <http://blixt.googlecode.com/>
 * 
 * @author Andreas Blixt <andreas@blixt.org>
 * @version 1.0
 */

Blox.Ui.HtmlViewport = new Class({
    initialize: function (ui, container) {
        this.ui = ui;
        this.html = new Element('div', { 'class': 'html-viewport' }).inject(container || document.body);

        this.blocks = [];
        
        /*
        if (!ui.blox.meta.html) {
            ui.blox.meta.html = {
                connections: []
            };
        }

        this.connections = ui.blox.meta.html.connections;
        */
        this.connections = [];

        var b = ui.blox.blocks;
        for (var i = 0, l = b.length; i < l; i++) {
            this.getUiBlock(b[i]);
        }

        for (var i = 0, l = b.length; i < l; i++) {
            for (var p in b[i].subscriptions) {
                for (var j = 0, m = b[i].subscriptions[p].length; j < m; j++) {
                    this.getUiConnection(b[i].subscriptions[p][j]);
                }
            }
        }

        ui.blox.addObserver(this);
    },
    
    buildLine: function (parent, x1, y1, x2, y2, seq) {
        var fx = x1, fy = y1, xAxis = true;

        seq = seq ? $A(seq) : [(x1 + x2) / 2];
        seq.push(y2);
        seq.push(x2);
        
        var lines = parent.getElements('div');
        
        for (var i = 0, l = seq.length; i < l; i++) {
            var tx = fx, ty = fy;
            if (xAxis) tx = seq[i]; else ty = seq[i];
            
            var line = lines[i] || new Element('div', { 'class': (xAxis ? 'horizontal' : 'vertical') + ' line' }).inject(parent);
            
            line.setStyles({
                height: (xAxis ? 1 : Math.abs(ty - fy) + 1),
                left: Math.min(fx, tx),
                top: Math.min(fy, ty),
                width: (xAxis ? Math.abs(tx - fx) + 1 : 1)
            });
            
            xAxis = !xAxis;
            fx = tx; fy = ty;
        }
        
        if (lines.length > seq.length) {
            for (var i = seq.length; i < lines.length; i++) {
                lines[i].destroy();
            }
        }
    },
    
    getUiBlock: function (block) {
        var b = this.blocks;
        for (var i = 0, l = b.length; i < l; i++) {
            if (b[i].block == block) return b[i];
        }

        var m;
        if (block.meta.html) {
            m = block.meta.html;
        } else {
            block.meta.html = m = { x: 100, y: 100 };
        }

        var uiBlock = {
            block: block,
            html: null,
            inputs: {}, outputs: {},
            movingBlock: new Element('div', {
                styles: {
                    display: 'none'
                },
                'class': 'moving-block'
            }).inject(this.html)
        };

        uiBlock.mousemove = this.handleMouseMove.bindWithEvent(uiBlock);

        var vp = this;

        var inputs, outputs, parameters;
        var html = new Element('div', {
            events: {
                mousedown: function (e) {
                    e.stop();
                    uiBlock.startX = e.client.x;
                    uiBlock.startY = e.client.y;
                    
                    var sz = uiBlock.html.getSize();
                    uiBlock.movingBlock.setStyles({
                        height: sz.y,
                        left: m.x,
                        top: m.y,
                        width: sz.x,
                        display: 'block'
                    });
                    
                    $(document).addEvents({
                        mousemove: uiBlock.mousemove,
                        mouseup: function (e) {
                            uiBlock.movingBlock.setStyle('display', 'none');

                            var m = uiBlock.block.meta.html;
                            m.x = e.client.x - (uiBlock.startX - m.x);
                            m.y = e.client.y - (uiBlock.startY - m.y);

                            uiBlock.html.setStyles({
                                left: m.x,
                                top: m.y
                            });

                            var s = uiBlock.block.subscribers;
                            for (var p in s) {
                                for (var i = 0, l = s[p].length; i < l; i++) {
                                    vp.getUiConnection(s[p][i]);
                                }
                            }

                            var s = uiBlock.block.subscriptions;
                            for (var p in s) {
                                for (var i = 0, l = s[p].length; i < l; i++) {
                                    vp.getUiConnection(s[p][i]);
                                }
                            }

                            $(document).removeEvents();
                        },
                        selectstart: function (e) {
                            e.stop();
                        }
                    });
                },
                mouseenter: function () {
                    this.addClass('hover');
                },
                mouseleave: function () {
                    this.removeClass('hover');
                }
            },
            styles: {
                left: m.x,
                top: m.y
            },
            'class': 'block ' + block.getBlockName().replace(' ', '-').toLowerCase()
        }).adopt(
            new Element('p', { 'class': 'name', text: block.getBlockName() }),
            parameters = new Element('ul', { 'class': 'parameters' }),
            inputs = new Element('ul', { 'class': 'inputs' }),
            outputs = new Element('ul', { 'class': 'outputs' })
        ).inject(this.html);

        for (var p in block.parameters) {
            new Element('li').adopt(
                new Element('label', { text: p }),
                new Element('input', {
                    events: {
                        change: function (e) {
                            // TODO: Change block parameter
                        },
                        mousedown: function (e) {
                            e.stopPropagation();
                        }
                    },
                    value: block.parameters[p]
                })
            ).inject(parameters);
        }

        for (var i = 0, l = block.inputs.length; i < l; i++) {
            uiBlock.inputs[block.inputs[i]] = new Element('li', { text: block.inputs[i] }).inject(inputs);
        }

        for (var i = 0, l = block.outputs.length; i < l; i++) {
            uiBlock.outputs[block.outputs[i]] = new Element('li', { text: block.outputs[i] }).inject(outputs);
        }

        uiBlock.html = html;
        b.push(uiBlock);

        return uiBlock;
    },
    
    getUiConnection: function (s) {
        var c = this.connections, conn;
        for (var i = 0, l = c.length; i < l; i++) {
            if (c[i].outBlock == s.publisher && c[i].output == s.output && c[i].inBlock == s.subscriber && c[i].input == s.input) {
                conn = c[i];
                break;
            }
        }

        var ci = this.getUiBlock(s.subscriber).inputs[s.input].getCoordinates();
        var co = this.getUiBlock(s.publisher).outputs[s.output].getCoordinates();

        if (!conn) {
            conn = {
                outBlock: s.publisher,
                output: s.output,
                inBlock: s.subscriber,
                input: s.input,
                seq: null
            };
            
            this.connections.push(conn);
        }

        if (!conn._html) conn._html = new Element('div', { 'class': 'connection' }).inject(this.html);
        this.buildLine(conn._html, co.right, (co.top + co.bottom) / 2, ci.left, (ci.top + ci.bottom) / 2, conn.seq);
        
        return conn;
    },
    
    handleMouseMove: function (e) {
        var m = this.block.meta.html;
        this.movingBlock.setStyles({
            left: e.client.x - (this.startX - m.x),
            top: e.client.y - (this.startY - m.y)
        });
    }
});
