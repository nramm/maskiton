import os
import sys
import glob
import time
import stat
import errno
import shutil
import socket

import fsops

class AlreadyLocked(OSError):
    pass

class FSLock(object):
    
    def __init__(self,path):
        self.path = path
        self.retry_delay = 0.1

    @property
    def locked(self):
        return os.path.exists(self.lockpath)

    @property
    def lockpath(self):
        return self.path + '.locked'

    @property
    def mylockpath(self):
        ident = '.(%s|%d).lock'%(socket.gethostname(),os.getpid())
        return self.path + ident

    def acquire(self):
        try:
            os.umask(0000)
            os.close(os.open(self.mylockpath,os.O_RDONLY|os.O_CREAT,0777))
            os.link(self.mylockpath,self.lockpath)
            if os.stat(self.mylockpath).st_nlink != 2:
                raise AlreadyLocked
            return True
        except OSError, e:
            if e.errno != errno.EEXIST: raise
            raise AlreadyLocked
        return False

    def release(self):
        fsops.remove(self.mylockpath)
        fsops.remove(self.lockpath)

    def __enter__(self):
        while True:
            try:
                self.acquire()
                return self
            except AlreadyLocked:
                time.sleep(self.retry_delay)

    def __exit__(self,et,ev,st):
        self.release()
        if ev: print ev

def test_lock_single(path):
    import numpy as np
    def read_write(path):
        a = np.random.random(10000)
        with open(path,'w') as fp:
            np.save(fp,a)
        time.sleep(0.1)
        with open(path,'r') as fp:
            b = np.load(fp)
        if np.any(a!=b):
            raise OSError('file lock was not atomic!!')
    while True:
        with FSLock(path):
            read_write(path)
        time.sleep(0.1)
        print '.',
        sys.stdout.flush()

def test_lock_many(path,count):
    '''
    ideally this stress test should be run 
    from multiple computers
    with access to a shared fs
    '''
    import multiprocessing as mp
    pool = mp.Pool(count)
    pool.map(test_lock_single,['%s.%d'%(path,i) for i in range(count)])

if __name__ == '__main__':
    FSLock(sys.argv[1]).release()
    test_lock_single(sys.argv[1])
