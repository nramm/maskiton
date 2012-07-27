#!/usr/bin/env python
# ecoding: utf-8

import json
import pprint
import urlparse

import tornado.ioloop
import tornado.web
import tornado.httpserver

from config import CONFIG
from rest import ImageUpload, SOMJob, SOMJobs, StackUpload, StackAverage

pprint.pprint(CONFIG)

application = tornado.web.Application([
    tornado.web.URLSpec(r'/xmipp/som',SOMJobs),
    tornado.web.URLSpec(r'/xmipp/som/(.+)',SOMJob),
    tornado.web.URLSpec(r'/images',ImageUpload),
    tornado.web.URLSpec(r'/stacks',StackUpload),
    tornado.web.URLSpec(r'/projects/([^/]+)/stacks/([^/]+)/average',StackAverage),
])

if __name__ == "__main__":
    server = tornado.httpserver.HTTPServer(application)
    server.bind(urlparse.urlparse(CONFIG['PROCESS_SERVER']).port)
    server.start(0)
    tornado.ioloop.IOLoop.instance().start()
