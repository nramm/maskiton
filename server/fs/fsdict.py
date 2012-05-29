
import time
import json
import cPickle as pickle

import fsops

etypes = {
    'json'   : json,
    'python' : pickle
}

class FSDict(object):
    '''
    somewhat similar to the python shelve object, except
    that it uses atomic updates to prevent other readers
    from reading updates in progress
    '''
    def __init__(self,path=None,etype='python'):
        self.etype = etype
        self._load = etypes[etype].load
        self._dump = etypes[etype].dump
        self.paused = False
        self.dirty = False
        self.path = path
        self.dict = {}
        self.load()

    def __getitem__(self,key):
        return self.dict[key]

    def __setitem__(self,key,value):
        self.dict[key] = value
        self.dirty = True
        if not self.paused: self.dump()

    def __contains__(self,key):
        return key in self.dict

    def get(self,key,default):
        return self.dict.get(key,default)

    def load(self):
        if self.path:
            try:
                with fsops.open(self.path,'rb') as dfile:
                    self.dict.update(self._load(dfile))
            except fsops.FileDoesNotExist:
                pass

    def dump(self):
        if self.dirty:
            if self.path:
                with fsops.open(self.path,'wb') as dfile:
                    self._dump(self.dict,dfile)
                    self.dirty = False

    def update(self,values):
        self.dict.update(values)
        self.dump()

    def __repr__(self):
        return "FSDict('%s','%s')"%(self.path,self.etype)

    def __enter__(self):
        self.paused = True
        return self

    def __exit__(self,ev,et,ex):
        self.paused = False
        if not ev: self.dump()










