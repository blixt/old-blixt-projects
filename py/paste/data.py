#
# Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
#
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
# Project homepage: <http://code.google.com/p/blixt/>
#

"""Data classes for the Paste application.

Data classes include data models and Django forms.
"""

from google.appengine.ext import db

from google.appengine.ext.webapp import template
from google.appengine.ext.db import djangoforms

class CodeSnippet(db.Model):
    code = db.TextProperty(required = True)
    title = db.StringProperty()
    author = db.UserProperty()
    added = db.DateTimeProperty(auto_now_add = True)

    def create_url(self, request = None):
        """Returns the absolute URL to the snippet, based on the supplied
        request.
        """

        key = str(self.key().id())
        if request:
            return request.relative_url(key)
        else:
            return '/' + key

class CodeSnippetForm(djangoforms.ModelForm):
    class Meta:
        model = CodeSnippet
        exclude = ['author']

class Comment(db.Model):
    snippet = db.ReferenceProperty(reference_class = CodeSnippet,
                                   collection_name = 'comments')
    comment = db.TextProperty(required = True)
    author = db.UserProperty()
    added = db.DateTimeProperty(auto_now_add = True)

class CommentForm(djangoforms.ModelForm):
    class Meta:
        model = Comment
        exclude = ['snippet', 'author']
