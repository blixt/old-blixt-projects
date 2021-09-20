#
# Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
#
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
# Project homepage: <http://code.google.com/p/blixt/>
#

"""Utility classes and functions for Google App Engine applications.
"""

from google.appengine.api import users
from google.appengine.ext import webapp

from google.appengine.ext.webapp import template

class ExtendedHandler(webapp.RequestHandler):
    """An extension to the webapp RequestHandler which automatically handles
    exceptions and enables various shortcuts.
    """

    def handle_exception(self, exception, debug_mode):
        """Handles exceptions by showing error.html to the user (or debug.html
        if debugging is enabled.
        """

        if debug_mode:
            self.template('debug.html', { 'exception': exception })
        else:
            self.template('error.html')

    def template(self, tpath, values = {}):
        """A shortcut for outputting a template.
        """

        path = self.request.path_qs
        user = users.get_current_user()

        values['user'] = user
        if user:
            values['logout_url'] = users.create_logout_url(path)
        else:
            values['login_url'] = users.create_login_url(path)

        self.response.out.write(template.render(tpath, values))
