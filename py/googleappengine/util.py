#
# Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
# Project homepage: <http://code.google.com/p/blixt/>
#
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#
# Dependencies: googleappengine <http://code.google.com/p/googleappengine/>
#               simplejson <http://undefined.org/python/#simplejson>
#

"""Utility classes and functions for Google App Engine applications.
"""

from google.appengine.api import users
from google.appengine.ext import webapp

from google.appengine.ext.webapp import template

import os, simplejson

def contains(sequence, value):
    """A recursive version of the 'in' operator.

    Usage:
    >>> util.contains([1, [2, 3], 4], 2)
    True
    """
    for i in sequence:
        if i == value or (hasattr(i, '__iter__') and contains(i, value)):
            return True
    return False

TEMPLATE_BASE = 'templates/'

class ExtendedHandler(webapp.RequestHandler):
    """An extension to the webapp RequestHandler which automatically handles
    exceptions and enables various shortcuts.

    By default, the handler will look for templates in the templates/
    directory. To change this path, set the TEMPLATE_BASE variable:
    >>> util.TEMPLATE_BASE = 'html/'
    >>> 
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

        tpath = os.path.join(TEMPLATE_BASE, tpath)
        self.response.out.write(template.render(tpath, values))

class ServiceHandler(webapp.RequestHandler):
    """Opens up all attributes that don't start with an underscore to HTTP
    requests.

    The WSGIApplication URL mapping to a ServiceHandler must include a regular
    expression group which will be used as the action (the method that will be
    called.):
    >>> application = webapp.WSGIApplication([
            ('/test/(\\w*)', TestService)
        ])
    >>> 

    Arguments that start with an underscore are also ignored. For the call to
    succeed, these arguments must have a default value.

    Inheritance is currently not supported. To make attributes of the base class
    available, redefine them in the child class.
    """
    def _is_public_attr(self, action):
        return (not action.startswith('_') and
                action in self.__class__.__dict__)
               
    def get(self, action):
        out = { 'status': 'unknown',
                'response': None }

        if self._is_public_attr(action):
            try:
                args = {}
                for arg in self.request.params:
                    if arg.startswith('_'): continue
                    args[str(arg)] = simplejson.loads(self.request.params[arg])

                attr = getattr(self, action)
                out['status'] = 'success'
                out['response'] = attr(**args) if callable(attr) else attr
            except Exception, e:
                out['status'] = 'error'
                out['response'] = { 'message': str(e),
                                    'type': e.__class__.__name__ }
        else:
            out['status'] = 'list'
            out['response'] = {}

            for a in self.__class__.__dict__:
                if self._is_public_attr(a):
                    attr = getattr(self, a)
                    if callable(attr):
                        code = attr.im_func.func_code # Unsafe
                        args = filter(lambda x: not x.startswith('_'),
                                      code.co_varnames[1:code.co_argcount])
                    else:
                        args = None

                    out['response'][a] = args
            
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(out, separators=(',', ':')))

    post = get
