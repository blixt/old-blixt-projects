#
# Copyright (c) 2008 Andreas Blixt <andreas@blixt.org>
#
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
# Project homepage: <http://blixt.googlecode.com/>
#

"""Entry point for the Paste application.

Registers the WSGI web application with request handlers, also defined
in this file.
"""

import wsgiref.handlers

from google.appengine.api import users
from google.appengine.ext import webapp

import data, util

class HomePage(util.ExtendedHandler):
    def get(self):
        recent_snippets = data.CodeSnippet.gql('ORDER BY added DESC LIMIT 10')
        self.template('home.html', {
            'form': data.CodeSnippetForm(auto_id = True),
            'recent_snippets': recent_snippets
        })

    def head(self):
        # I would like to send the len() of the get() request here, but
        # apparently altering the Content-Length header is disallowed.
        pass

    def post(self):
        form = data.CodeSnippetForm(data = self.request.POST, auto_id = True)
        if form.is_valid():
            snippet = form.save(commit = False)
            snippet.author = users.get_current_user()
            snippet.put()

            self.template('success.html', {
                'snippet_url': snippet.create_url(self.request)
            })
        else:
            recent_snippets = data.CodeSnippet.gql('ORDER BY added DESC LIMIT 10')
            self.template('home.html', {
                'form': form,
                'recent_snippets': recent_snippets
            })

class CodeSnippetPage(util.ExtendedHandler):
    def get_snippet(self):
        return data.CodeSnippet.get_by_id(int(self.request.path_info_peek()))

    def output(self, snippet, form):
        if snippet:
            comment_list = snippet.comments.order('added').fetch(1000)
            self.template('snippet.html', {
                'snippet': snippet,
                'form': form,
                'comment_list': comment_list
            })
        else:
            self.template('not-found.html')

    def get(self):
        self.output(self.get_snippet(), data.CommentForm(auto_id = True))

    def head(self):
        # I would like to send the len() of the get() request here, but
        # apparently altering the Content-Length header is disallowed.
        pass

    def post(self):
        snippet = self.get_snippet()
        
        form = data.CommentForm(data = self.request.POST, auto_id = True)
        if form.is_valid():
            comment = form.save(commit = False)
            comment.author = users.get_current_user()
            comment.snippet = snippet
            comment.put()

        self.output(snippet, form)

def main():
    application = webapp.WSGIApplication([
        ('/', HomePage),
        ('/\\d+', CodeSnippetPage)
    ], debug = True)
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()
