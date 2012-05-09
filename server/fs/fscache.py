

import os
import re
import time
import json
import errno
import shutil
import inspect
import hashlib
import subprocess as sp
import cPickle as pickle

from misc import deferred, controlled

import fsdict
import fsjail
import fsops

with open('config.json','r') as fp:
    CONFIG = json.load(fp)

CACHE_PATH = CONFIG['CACHE_PATH']

def hashargs(prefix='',args=[],kwargs={}):
    md5 = hashlib.md5()
    for arg in args:
        md5.update(str(arg))
    for key in sorted(kwargs):
        md5.update(str(key))
        md5.update(str(kwargs[key]))
    return prefix+'/'+md5.hexdigest()

def cache(func,*args,**kwargs):
    return FSCache.start(func,*args,**kwargs)

def status(func,*args,**kwargs):
    return FSCache(func,*args,**kwargs).status

def follow(func,*args,**kwargs):
    cache = FSCache(func,*args,**kwargs)
    generator = func(cache,*args,**kwargs)
    if not inspect.isgenerator(generator):
        raise RuntimeError('passed function must be a generator to be followed')
    return generator

def stat(func,*args,**kwargs):
    return FSCache(func,*args,**kwargs).stat.dict

class FSCache(object):
    '''
    provides convenience for coordinating between functions that write to
    the filesystem.

    todos: make caching architecture more resilient to files disappearing
           while jobs are still running.  Currently can break if a job
           that has been deemed "cached" has those cached files removed
           while they are being used.  Currently no shared "locks" are
           implemented for jobs reading from the cache.
    '''

    @classmethod
    def start(cls,func,*args,**kwargs):
        return cls(func,*args,**kwargs).run(func,*args,**kwargs)

    def __init__(self,func,*args,**kwargs):
        self.func = func
        self.name = func.__name__
        self.hash = hashargs(self.name,args,kwargs)

    def __call__(self,func,*args,**kwargs):
        return FSCache(func,*args,**kwargs).run(func,*args,**kwargs)

    def run(self,func,*args,**kwargs):
        with self.lock:
            if self.cached:
                return fsdict.FSDict(self.donepath)['output']
            self.status = fsdict.FSDict(self.statpath)
            output = self.sub(func,*args,**kwargs)
            with fsdict.FSDict(self.donepath) as cached:
                cached['func']   = self.name
                cached['args']   = args
                cached['kwargs'] = kwargs
                cached['output'] = output
            return output

    def sub(self,func,*args,**kwargs):
        return func(self,*args,**kwargs)

    @classmethod
    def follow(cls,func,*args,**kwargs):
        cache = cls(func,*args,**kwargs)
        generator = func(cache,*args,**kwargs)
        if not inspect.isgenerator(generator):
            raise RuntimeError('passed function must be a generator to be followed')
        return generator

    @deferred
    def fs(self):
        jailpath = os.path.join(CACHE_PATH,self.hash)
        return fsjail.FSJail(jailpath)

    @deferred
    def lockpath(self):
        return self.fs.ext('.locked')

    @deferred
    def donepath(self):
        return self.fs.ext('.cached')

    @deferred
    def statpath(self):
        return self.fs.ext('.status')

    @property
    def cached(self):
        return self.fs.exists(self.donepath)

    @property
    def locked(self):
        return self.lock.locked

    @deferred
    def lock(self):
        return self.fs.lock(self.lockpath)

    @deferred
    def stat(self):
        return fsdict.FSDict(self.statpath)

    @deferred
    def stdnull(self):
        return open('/dev/null','wb')

    def __repr__(self):
        return "CacheFS('%s')"%self.fs.base




