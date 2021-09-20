# -*- coding: cp1252 -*-
#
# Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
#
# Project location:
# /svn/trunk/py/space/ @ <http://code.google.com/p/blixt/>
#
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

"""Google App Engine entry point for the Space game.

Registers the WSGI web application with request handlers, also defined
in this file.
"""

from google.appengine.api import urlfetch
from google.appengine.ext import webapp
import wsgiref.handlers

import cStringIO as StringIO
import time

import space

class SpaceServer(webapp.RequestHandler):
    time_offset = None
    
    def get(self):
        # Get client parameters.
        auth = self.request.get(space.AUTH_KEY)
        command = int(self.request.get(space.COMMAND))
        packet_id = int(self.request.get(space.PACKET_ID))
        client_timestamp  = int(self.request.get(space.TIMESTAMP))

        space.now = time.time()

        # Restore the session.
        session = space.Session(auth)
        if auth == session.auth:
            session.player.handle_command(session, command, packet_id)
            template = '{"%s":{%s}}'
        else:
            template = '{"%s":%d,"%s":"%s","%%s":{%%s}}' % (
                space.PLAYER_ID, session.player.id,
                space.AUTH_KEY, session.auth)

        # Update the session.
        session.update()

        # Serialize world to a string.
        buf = StringIO.StringIO()
        for ent_id in session.entities:
            ent = session.entities[ent_id]
            if buf.tell() > 0: buf.write(',')
            buf.write('"%d":%s' % (ent_id, ent.to_json()))

        # Send world to client.
        self.response.out.write(template % (space.ENTITY_DATA, buf.getvalue()))
        buf.close()
        
def main():
    application = webapp.WSGIApplication([
        ('/server', SpaceServer)
    ])
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()
