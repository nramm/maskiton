
import time
import multiprocessing as mp

from tornado.gen import engine, Task
from tornado.web import RequestHandler, asynchronous

from fs import cache, FSCache
from xmipp import hed_average
from rest_image import rest_saveImagePath
from rest_stack_handling import rest_queryStackPath

def rest_average(hed,img):
    return cache(hed_average,hed,img)

def rest_average_status(projectid,stackid,callback):
    hed,img = rest_queryStackPath(projectid,stackid)
    cache = FSCache(hed_average,hed,img)
    print 'starting avg job, cached:',cache.cached,'running:',cache.locked
    print '   hed:',hed
    print '   img:',img
    if not cache.cached and not cache.locked:
        mp.Process(target=rest_average,args=[hed,img]).start()
    status = cache.stat
    status = {
            'total' : status.get('total', None),
            'done'  : status.get('done' , None),
            'url'   : rest_saveImagePath(status.get('avg.spi',None)),
    }
    callback(status)

class StackAverage(RequestHandler):

    @asynchronous
    @engine
    def get(self,projectid,stackid):
        state = yield Task(rest_average_status,projectid,stackid)
        self.set_header('Access-Control-Allow-Origin','*')
        self.write(state)
        self.finish()

