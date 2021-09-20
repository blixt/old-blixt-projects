var Sprite = new Class({
    initialize: function (imgPath, frmW, frmH, numDirs) {
        if (!numDirs) numDirs = 1;

        this.imagePath = imgPath;
        this.frameWidth = frmW;
        this.frameHeight = frmH;
        this.numDirections = numDirs;

        this.x = 0; this.y = 0;
        this.frame = 0;
        this.direction = 0;

        this.timerRotate = -1;

        this.element = new Element('canvas'/*'div'*/, {
            styles: {
                backgroundImage: 'url(' + imgPath + ')',
                height: frmH,
                position: 'absolute',
                width: frmW,
                zIndex: Sprite.Z_INDEX++
            }/****/,width:frmW,height:frmH
        }).inject(document.body);

        this.animations = [new Sprite.Animation('Idle', 1)];
        this.animation = this.animations[0];

        this.refresh();
    },

    angleToDirection: function (angle) {
        this._angle = angle;
        return Math.round(angle / (Math.PI * 2) * this.numDirections);
    },

    destroy: function () {
        $clear(this.timerRotate);
        this.element.destroy();
    },

    makeDirectionValid: function (direction) {
        if (direction < 0) {
            return parseInt(Math.ceil(-direction / this.numDirections) * this.numDirections);
        } else {
            return parseInt(direction % this.numDirections);
        }
    },

    moveTo: function (x, y) {
        this.x = x; this.y = y;
        this.element.morph({
            left: x,
            top: y
        });
    },

    refresh: function () {
        this.element.setStyles({
            left: this.x - this.frameWidth / 2,
            top: this.y - this.frameHeight / 2
        });
    },
    
    rotateTo: function (direction, fps) {
        if (!fps) fps = 20;
        
        $clear(this.timerRotate);
        
        direction = this.makeDirectionValid(direction);
        var sign = this.direction > direction ? -1 : 1;
        var delta = Math.abs(direction - this.direction) > this.numDirections / 2 ? -sign : sign;
        var rot = function () {
            if (this.direction == direction) return;
            this.setDirection(this.direction + delta, true);
            this.timerRotate = rot.delay(1000 / fps, this);
        };

        rot.call(this);
    },
    
    setDirection: function (direction, keepTimer) {
        if (!keepTimer) $clear(this.timerRotate);

        this.direction = this.makeDirectionValid(direction);
        
        this._temp();
        this.element.setStyle('background-position', [0, (this.direction * this.animation.numFrames + this.frame) * -this.frameHeight]);
    },
    
    setPosition: function (x, y) {
        this.x = x; this.y = y;
        this.refresh();
    },

    _temp: function () {
        var a = this._angle || 0.0;//Math.PI * 2 / this.numDirections * this.direction;
        
		var c = this.element.getContext('2d');
		c.clearRect(0, 0, this.frameWidth, this.frameHeight);

		c.lineWidth = 3;
		c.strokeStyle = this._color || '#fff';
        c.beginPath();
        c.moveTo(this.frameWidth / 2 + Math.cos(a) * this.frameWidth * 0.4, this.frameHeight / 2 + Math.sin(a) * this.frameWidth * 0.4);
        c.lineTo(this.frameWidth / 2 + Math.cos(a + Math.PI * 0.8) * this.frameWidth * 0.4, this.frameHeight / 2 + Math.sin(a + Math.PI * 0.8) * this.frameWidth * 0.4);
        c.lineTo(this.frameWidth / 2 + Math.cos(a - Math.PI * 0.8) * this.frameWidth * 0.4, this.frameHeight / 2 + Math.sin(a - Math.PI * 0.8) * this.frameWidth * 0.4);
        c.lineTo(this.frameWidth / 2 + Math.cos(a) * this.frameWidth * 0.4, this.frameHeight / 2 + Math.sin(a) * this.frameWidth * 0.4);
        c.stroke();
    }
});

Sprite.Animation = new Class({
    initialize: function (name, numFrames) {
        this.name = name;
        this.numFrames = numFrames;
    }
});

Sprite.Z_INDEX = 100;

var Space = new Class({
    initialize: function () {
        $(document.body).setStyles({
            background: '#000',
            color: '#fff',
            overflow: 'hidden'
        });

        this.net = new Space.Net('/server', this);
        var n = this.net;

        var lastDown = '';
        $(document).addEvents({
            keydown: function (e) {
                if (lastDown == e.key) return;

                switch (e.key) {
                    case 'up':
                        n.sendCommand(Space.Net.ACCELERATE);
                        break;
                    case 'down':
                        n.sendCommand(Space.Net.DECELERATE);
                        break;
                    case 'left':
                        n.sendCommand(Space.Net.TURN_LEFT);
                        break;
                    case 'right':
                        n.sendCommand(Space.Net.TURN_RIGHT);
                        break;
                    case 'space':
                        n.sendCommand(Space.Net.SHOOT);
                        break;
                    default:
                        return;
                }

                lastDown = e.key;
            },
            
            keyup: function (e) {
                switch (e.key) {
                    case 'up':
                    case 'down':
                        n.sendCommand(Space.Net.STOP);
                        break;
                    case 'left':
                    case 'right':
                        n.sendCommand(Space.Net.TURN_STOP);
                        break;
                    default:
                        return;
                }
                
                lastDown = '';
            }
        });
    }
});

Space.PLAYER = 0;
Space.PROJECTILE = 1;

Space.TICK_DURATION = 25;

Space.Entity = new Class({
    initialize: function (id, type) {
        this.id = id;
        this.sprite = this.createSprite();
        this.type = type;

        this.lastUpdate = -1;
        this.x = 0; this.y = 0;
        this.velocityX = 0.0;
        this.velocityY = 0.0;

        Space.Entity.all[id] = this;
        
        this.timerMove = this.clientRefresh.periodical(Space.TICK_DURATION, this);
    },
    
    clientRefresh: function () {
        var dt = Space.TICK_DURATION / 1000;
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.refresh();
    },
    
    createSprite: function () {
        throw 'createSprite() must be overridden.';
    },
    
    destroy: function () {
        $clear(this.timerMove);

        delete Space.Entity.all[this.id];

        this.sprite.destroy();
        delete this.sprite;
    },
    
    refresh: function () {
        this.sprite.setPosition(this.x, this.y);
    },
    
    setPosition: function (x, y) {
        this.x = x; this.y = y;
        this.refresh();
    }
});

Space.Entity.all = {};

Space.Projectile = new Class({
    Extends: Space.Entity,

    initialize: function (id) {
        this.parent(id, Space.PROJECTILE);
        this.sprite._color = '#ff0000';
    },
    
    createSprite: function () {
        return new Sprite('projectile.png', 20, 20, 36);
    },
    
    refresh: function () {
        this.parent();
        this.sprite.setDirection(this.sprite.angleToDirection(Math.atan2(this.velocityY, this.velocityX)));
    }
});

Space.Player = new Class({
    Extends: Space.Entity,

    initialize: function (id, name) {
        this.parent(id, Space.PLAYER);
        this.direction = 0.0;
        this.name = name;

        this.moveMod = 0;
        this.turnMod = 0;

        this.ping = -1;
        
        this.sprite._color = Space.Player.colors[id % 10];
    },

    clientRefresh: function () {
        var dt = Space.TICK_DURATION / 1000, m = Space.Player.ACCELERATION_RATE * this.moveMod * dt;
        this.direction += Space.Player.TURN_RATE * this.turnMod * dt;
        this.velocityX += Math.cos(this.direction) * m;
        this.velocityY += Math.sin(this.direction) * m;
        
        var spd = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (spd > Space.Player.MAX_SPEED) {
            var d = Space.Player.MAX_SPEED / spd;
            this.velocityX *= d;
            this.velocityY *= d;
        }

        this.parent();
    },

    createSprite: function () {
        return new Sprite('ship.png', 50, 50, 36);
    },
    
    handleCommand: function (cmd) {
        switch (cmd) {
            case Space.Net.ACCELERATE:
                this.moveMod = 1;
                break;
            case Space.Net.DECELERATE:
                this.moveMod = -1;
                break;
            case Space.Net.STOP:
                this.moveMod = 0;
                break;
            case Space.Net.TURN_LEFT:
                this.turnMod = -1;
                break;
            case Space.Net.TURN_RIGHT:
                this.turnMod = 1;
                break;
            case Space.Net.TURN_STOP:
                this.turnMod = 0;
                break;
        }
    },
    
    refresh: function () {
        this.parent();
        this.sprite.setDirection(this.sprite.angleToDirection(this.direction));
    }
});

Space.Player.colors = {
    0: '#7137c8',
    1: '#d42aff',
    2: '#ffcc00',
    3: '#0000ff',
    4: '#2aff80',
    5: '#ccff00',
    6: '#ff0000',
    7: '#ff6600',
    8: '#00ff00',
    9: '#ffffff'
};

Space.Player.ACCELERATION_RATE = 15.0;
Space.Player.TURN_RATE = 0.8;
Space.Player.MAX_SPEED = 40.0;

Space.Net = new Class({
    initialize: function (service) {
        this.player = null;

        this.status = new Element('pre').inject(document.body);

        this.auth = '';
        this.lastPing = 0;
        this.packet = 0;
        this.pendingCount = {};
        this.ping = -1;
        this.sentPackets = 0;
        this.service = service;

        this.timer = (function () {
            if (this.auth) {
                if (this.pending(Space.Net.REFRESH) < 3) {
                    this.sendCommand(Space.Net.REFRESH);
                }

                var now = $time();
                if (now - this.lastPing > 2000 && !this.pending(Space.Net.PING_REQUEST)) {
                    this.lastPing = now;
                    this.sendCommand(Space.Net.PING_REQUEST);
                }
            } else {
                if (!this.pending(Space.Net.REFRESH)) {
                    this.sendCommand(Space.Net.REFRESH);
                }
            }
        }).periodical(300, this);
    },
    
    handleResponse: function (res, req) {
        var params = req.params;
    
        var authKey = res[Space.Net.AUTH_KEY],
            cmd = params[Space.Net.COMMAND],
            entityData = res[Space.Net.ENTITY_DATA],
            packetId = params[Space.Net.PACKET_ID],
            playerId = res[Space.Net.PLAYER_ID];

        this.ping = $time() - params[Space.Net.TIMESTAMP];

        for (var i in Space.Entity.all) {
            if (!entityData[i]) Space.Entity.all[i].destroy();
        }

        for (var i in entityData) {
            var d = entityData[i];
            
            var entityType = d[Space.Net.ENTITY_TYPE],
                posX = d[Space.Net.POSITION_X], posY = d[Space.Net.POSITION_Y],
                velX = d[Space.Net.VELOCITY_X], velY = d[Space.Net.VELOCITY_Y],
                timestamp = d[Space.Net.TIMESTAMP];

            var ent = Space.Entity.all[i];
            switch (entityType) {
                case Space.PLAYER:
                    if (!ent) ent = new Space.Player(i, 'Player');
                    ent.ping = d[Space.Net.PING];
                    break;
                case Space.PROJECTILE:
                    if (!ent) ent = new Space.Projectile(i);
                    break;
            }
            
            if ((ent != this.player || packetId % 10 == 0) && ent.lastUpdate < timestamp) {
                ent.x = posX; ent.y = posY;
                ent.velocityX = velX; ent.velocityY = velY;
                ent.lastUpdate = timestamp;
                
                if (entityType == Space.PLAYER) {
                    ent.direction = d[Space.Net.DIRECTION];
                }

                if (this.ping >= 0) {
                    var m = this.ping / 1000;
                    ent.x += velX * m; ent.y += velY * m;
                }

                ent.refresh();
            }
        }

        if (playerId == -1) {
            this.auth = null;
            this.player = null;
        } else if (playerId) {
            this.auth = authKey;
            this.player = Space.Entity.all[playerId];
        }

        var s = 'Local/server ping: ' + this.ping + 'ms / ' + (this.player ? this.player.ping : '?') + 'ms\n';
        s += 'Packets sent: ' + this.sentPackets + '\n';
        if (this.player) {
            s += 'Id/Auth key: ' + this.player.id + ' / ' + this.auth + '\n';
            s += 'Player direction: ' + (this.player ? this.player.direction : '?') + '\n';
            s += 'Player velocity: ' + this.player.velocityX + ', ' + this.player.velocityY + '\n';
        }
        this.status.set('text', s);

        this.pendingChange(cmd, -1);

        if (cmd == Space.Net.PING_REQUEST) {
            this.sendCommand(Space.Net.PONG);
        }
    },
    
    pending: function (cmd) {
        return this.pendingCount[cmd] || 0;
    },
    
    pendingChange: function (cmd, delta) {
        this.pendingCount[cmd] = this.pending(cmd) + delta;
    },
    
    sendCommand: function (cmd, packet) {
        this.pendingChange(cmd, 1);
        if (packet === undefined) packet = this.packet++;

        params = {};
        params[Space.Net.TIMESTAMP] = $time();
        params[Space.Net.AUTH_KEY] = this.auth;
        params[Space.Net.COMMAND] = cmd;
        params[Space.Net.PACKET_ID] = packet;
        
        var n = this;
        var req = new Request.JSON({
            secure: false,
            url: this.service,
            onComplete: function (result) {
                n.handleResponse(result, this);
            }
        });

        req.params = params;
        req.get(params);
        
        this.sentPackets++;

        if (this.player) this.player.handleCommand(cmd, packet);
    }
});

Space.Net.AUTH_KEY = 'a';
Space.Net.COMMAND = 'c';
Space.Net.DIRECTION = 'd';
Space.Net.ENTITY_DATA = 'e';
Space.Net.ENTITY_ID = 'i';
Space.Net.ENTITY_TYPE = 't';
Space.Net.PACKET_ID = 'q';
Space.Net.PING = 'p';
Space.Net.PLAYER_ID = 'j';
Space.Net.POSITION_X = 'x';
Space.Net.POSITION_Y = 'y';
Space.Net.TIMESTAMP = 's';
Space.Net.VELOCITY_X = 'u';
Space.Net.VELOCITY_Y = 'v';

Space.Net.REFRESH = 0;
Space.Net.PONG = 1;
Space.Net.ACCELERATE = 2;
Space.Net.DECELERATE = 3;
Space.Net.STOP = 4;
Space.Net.TURN_LEFT = 5;
Space.Net.TURN_RIGHT = 6;
Space.Net.TURN_STOP = 7;
Space.Net.SHOOT = 8;
Space.Net.PING_REQUEST = 9;
