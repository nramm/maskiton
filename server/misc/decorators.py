

def deferred(fn):
    class lazy(object):
        def __get__(self,obj,cls):
            value = fn(obj)
            setattr(obj,fn.__name__,value)
            return value
    return lazy()

def controlled(cls):
    class nprop(object):
        def __get__(self,obj,_):
            return cls.get.im_func(obj)
        def __set__(self,obj,val):
            if not hasattr(cls,'set'):
                raise RuntimeError('property: %s is not setable'%(cls.__name__))
            return cls.set.im_func(obj,val)
    return nprop()

def subobject(cls):
    @deferred
    def make(self):
        return cls()
    return make

class replaceable(object):
    def __init__(self,fget):
        self.fget = fget
    def __get__(self,obj,cls):
        return self.fget(obj)

def memoize(function):
    cache = {}
    def fetch(self,*args):
        if args not in cache:
            cache[args] = function(self,*args)
        return cache[args]
    return fetch