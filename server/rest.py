#!/usr/bin/env python
# ecoding: utf-8

import json
import urlparse

import tornado.ioloop
import tornado.web
import tornado.httpserver

from rest_image import ImageUpload
from rest_xmipp_som import SOMJob, SOMJobs
from rest_stack_handling import StackUpload
from rest_stack_average  import StackAverage

with open('config.json','r') as fp:
    CONFIG = json.load(fp)

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


