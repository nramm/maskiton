import os
import time
import shutil

import fslock
import fsops
import fsreglob

class FSJail(object):
    '''
    provides an advisory fs jail that helps limit path operations to a specified base
    directory.  It also supplies method for acquiring atomic locks on paths, and
    for opening files for write and updates in an psuedo-atomic fashion.  All of this
    is to try and make it safer for files to be read, written and updated from multiple
    processes
    '''

    def __init__(self,path):
        self.base = path
    
    def touch(self,path):
        fsops.touch(self.pathto(path))
    
    def join(self,path=None):
        if path == None:
            return self.base
        path = os.path.join(self.base,path)
        if self.base not in path:
            if path not in self.base:
                # if the path we are creating is not in the cache
                # or on the way to it then we have a problem with it
                raise ValueError("[warning] path: %s is outside boundary of root: %s"%(path,self.base))
        return path
    
    def ext(self,ext):
        return self.pathto(self.base+ext)

    def open(self,path,mode,perm=0755):
        return fsops.open(self.pathto(path),mode,perm)

    def exists(self,path=None):
        return os.path.exists(self.join(path))

    def rm(self,path=None):
        fsops.remove(self.join(path))

    def rmdir(self,path=None):
        path = self.join(path)
        if self.exists(path):
            shutil.rmtree(path)

    def ln(self,srcpath,dstpath):
        srcpath = os.path.abspath(srcpath)
        dstpath = self.pathto(dstpath)
        return fsops.link(srcpath,dstpath)

    def mkdir(self,path=None):
        path = self.join(path)
        if not os.path.exists(path):
            os.makedirs(path)
        return path + '/'

    def pathto(self,path=None):
        path = self.join(path)
        self.mkdir(os.path.dirname(path))
        return path

    def cp(self,src,dst):
        dst = self.pathto(dst)
        with self.open(dst,'w'):
            shutil.copy(src,dst)
        return dst

    def mv(self,src,dst):
        dst = self.pathto(dst)
        os.rename(src,dst)
        return dst

    def lock(self,path=None):
        return fslock.FSLock(self.pathto(path))

    def locked(self,path=None):
        return self.lock(path).locked

    def glob(self,pattern):
        return fsreglob.reglob(self.join(pattern))




