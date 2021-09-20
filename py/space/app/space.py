# -*- coding: cp1252 -*-
#
# Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
#
# Project location:
# /svn/trunk/py/space/ @ <http://code.google.com/p/blixt/>
#
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

from google.appengine.api import memcache
from google.appengine.ext import db
import logging, math, uuid

# The boundaries of the Universe!
DIMENSION_X = 5000
DIMENSION_Y = 5000

VERSION = 2

AUTH_KEY = 'a'
COMMAND = 'c'
DIRECTION = 'd'
ENTITY_DATA = 'e'
ENTITY_ID = 'i'
ENTITY_TYPE = 't'
PACKET_ID = 'q'
PING = 'p'
PLAYER_ID = 'j'
POSITION_X = 'x'
POSITION_Y = 'y'
TIMESTAMP = 's'
VELOCITY_X = 'u'
VELOCITY_Y = 'v'

REFRESH = 0
PONG = 1
ACCELERATE = 2
DECELERATE = 3
STOP = 4
TURN_LEFT = 5
TURN_RIGHT = 6
TURN_STOP = 7
SHOOT = 8
PING_REQUEST = 9

now = None

class Error(Exception):
    pass

class NotAuthenticatedError(Error):
    pass

class PlayerNotFoundError(Error):
    pass

class StaticClassError(Error):
    pass

class Client(db.Model):
    @staticmethod
    def create():
        client = Client(key_name=uuid.uuid4().get_hex())
        client.save()

        return client

    @staticmethod
    def kill(auth):
        client = Client.get_by_key_name(auth)
        if client: client.delete()

class Entity(object):
    TYPE = -1

    @staticmethod
    def get_next_id():
        return memcache.incr('next_id', initial_value=1)

    def __init__(self, session):
        if not session.auth:
            raise NotAuthenticatedError('Must authenticate first.')
        
        self.id = Entity.get_next_id()
        self.position_x = 0.0
        self.position_y = 0.0
        self.velocity_x = 0.0
        self.velocity_y = 0.0

        self.last_refresh = now

        session.data[self.id] = self
        session.entities[self.id] = self

    def refresh(self):
        dt = now - self.last_refresh

        # Move the entity and make it wrap around boundaries.
        # TODO: Handle extreme cases where entity has moved double the
        #       boundary length.
        self.position_x += self.velocity_x * dt
        if self.position_x < 0:
            self.position_x += DIMENSION_X
        elif self.position_x > DIMENSION_X:
            self.position_x -= DIMENSION_X

        self.position_y += self.velocity_y * dt
        if self.position_y < 0:
            self.position_y += DIMENSION_Y
        elif self.position_y > DIMENSION_Y:
            self.position_y -= DIMENSION_Y
        
        self.last_refresh = now

    def to_json(self):
        return '{"%s":%d,"%s":%f,"%s":%f,"%s":%f,"%s":%f,"%s":%f}' % (
            ENTITY_TYPE, self.TYPE,
            POSITION_X, self.position_x,
            POSITION_Y, self.position_y,
            VELOCITY_X, self.velocity_x,
            VELOCITY_Y, self.velocity_y,
            TIMESTAMP, self.last_refresh)

class Player(Entity):
    TYPE = 0

    ACCELERATION_RATE = 15.0
    TURN_RATE = 0.8
    MAX_SPEED = 40.0
    TIMEOUT = 10.0

    def __init__(self, session):
        super(Player, self).__init__(session)

        self.direction = 0.0

        self.position_x = 500.0
        self.position_y = 300.0

        self.move_mod = 0
        self.turn_mod = 0

        self.last_packet_id = None
        self.last_packet_time = now

        self.ping = 0
        self.ping_time = None

    def handle_command(self, session, cmd, packet_id):
        if cmd == PONG:
            self.ping = (now - self.ping_time) * 1000
        elif cmd == ACCELERATE:
            self.move_mod = 1
        elif cmd == DECELERATE:
            self.move_mod = -1
        elif cmd == STOP:
            self.move_mod = 0
        elif cmd == TURN_LEFT:
            self.turn_mod = -1
        elif cmd == TURN_RIGHT:
            self.turn_mod = 1
        elif cmd == TURN_STOP:
            self.turn_mod = 0
        elif cmd == SHOOT:
            self.shoot(session)
        elif cmd == PING_REQUEST:
            self.ping_time = now

        self.last_packet_id = packet_id
        self.last_packet_time = now

    def refresh(self):
        #if now - self.last_packet_time >= self.TIMEOUT:
        #    self.destroy()
        #    return

        dt = now - self.last_refresh

        # If the entity was already updated within a tenth of a second, don't
        # bother updating...
        if dt < 0.1:
            return

        # When acceleration or turning is involved, the entity will be updated
        # step-wise.
        # TODO: The "accelerating but not turning" case can easily be handled
        #       using a formula.
        if self.move_mod or self.turn_mod:
            times = dt // 0.1
            dt /= times
        # Don't allow huge time steps either as they can mess with boundaries.
        elif dt > 1:
            times = dt // 1
            dt /= times
        else:
            times = 1

        for i in xrange(times):
            if self.turn_mod:
                self.direction = (self.direction + self.TURN_RATE *
                                  self.turn_mod * dt) % (math.pi * 2)

            if self.move_mod:
                m = self.ACCELERATION_RATE * self.move_mod * dt
                self.velocity_x += math.cos(self.direction) * m
                self.velocity_y += math.sin(self.direction) * m

                # TODO: Investigate more efficient methods.
                spd = math.sqrt(self.velocity_x ** 2 + self.velocity_y ** 2)
                if spd > self.MAX_SPEED:
                    d = self.MAX_SPEED / spd
                    self.velocity_x *= d
                    self.velocity_y *= d

            # Move the entity and make it wrap around boundaries.
            # TODO: Handle extreme cases where entity has moved double the
            #       boundary length.
            self.position_x += self.velocity_x * dt
            if self.position_x < 0:
                self.position_x += DIMENSION_X
            elif self.position_x > DIMENSION_X:
                self.position_x -= DIMENSION_X

            self.position_y += self.velocity_y * dt
            if self.position_y < 0:
                self.position_y += DIMENSION_Y
            elif self.position_y > DIMENSION_Y:
                self.position_y -= DIMENSION_Y
        
        self.last_refresh = now

    def shoot(self, session):
        proj = Projectile(session)

    def to_json(self):
        f = '{"%s":%d,"%s":%f,"%s":%f,"%s":%f,"%s":%f,"%s":%f,"%s":%d,"%s":%f}'
        return f % (
            ENTITY_TYPE, self.TYPE,
            POSITION_X, self.position_x,
            POSITION_Y, self.position_y,
            VELOCITY_X, self.velocity_x,
            VELOCITY_Y, self.velocity_y,
            DIRECTION, self.direction,
            PING, self.ping,
            TIMESTAMP, self.last_refresh)

class Projectile(Entity):
    TYPE = 1
    SPEED = 75.0

    def __init__(self, session):
        super(Projectile, self).__init__(session)

        p = self.player = session.player

        self.position_x = p.position_x
        self.position_y = p.position_y

        self.velocity_x = math.cos(p.direction) * self.SPEED
        self.velocity_y = math.sin(p.direction) * self.SPEED

class Session(object):
    @staticmethod
    def refresh_clients():
        """Updates the client list in memcache."""
        clients = Client.all(keys_only=True)

        new_keys = set([c.name() for c in clients])
        old_keys = set(memcache.get('clients') or [])

        rem = old_keys - new_keys
        add = new_keys - old_keys

        memcache.set('clients', new_keys)
        memcache.delete_multi(rem, key_prefix='client_')
        memcache.add_multi(dict.fromkeys(add), key_prefix='client_')

    def __init__(self, auth=None):
        self.auth = None
        self.data = None
        self.entities = {}
        self.player = None

        # Get a list of all clients from memcache, then fetch the clients.
        clients = memcache.get('clients')
        if clients:
            # Get data for all clients.
            data = memcache.get_multi(clients, key_prefix='client_')

            # The keys are actually auth keys, so if the auth key sent by client
            # matches, that key will represent the client data in memcache.
            if auth in data:
                self.auth = auth
                self.data = data[auth] or {}

                # Find the player entity.
                for i in self.data:
                    entity = self.data[i]
                    if isinstance(entity, Player):
                        self.player = entity
                        break

            # Build entities dictionary.
            for key in data:
                if data[key]: self.entities.update(data[key])

        # Current session has not been authenticated, create a client.
        # TODO: This should be separate from session creation to allow
        #       spectators.
        if not self.auth:
            client = Client.create()
            Session.refresh_clients()

            self.auth = client.key().name()
            self.data = {}

            self.player = Player(self)

    def kill(self):
        Client.kill(self.auth)
        Session.refresh_clients()

    def update(self):
        if self.auth:
            for i in self.data:
                self.data[i].refresh()
            memcache.set('client_' + self.auth, self.data)
