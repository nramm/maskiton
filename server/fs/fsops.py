import os
import time
import errno
from contextlib import contextmanager

import fslock

def basename(path):
    return os.path.basename(path).split('.')[0]

def remove(path):
    try:
        if path: os.unlink(path)
    except OSError, e:
        if e.errno != errno.ENOENT: raise

def touch(path):
    with open(path,'a'):
        os.utime(path,None)

def mkdir(path):
    try: os.makedirs(path, 0755)
    except OSError, e:
        if e.errno != errno.EEXIST:
            raise

def link(path,npath):
    if not os.path.exists(path):
        raise FileDoesNotExist(path)
    if os.path.exists(npath):
        remove(npath)
    os.symlink(path,npath)
    return npath

def mtime(path):
    mtime = os.stat(path).st_mtime
    return time.time() - mtime

class FilePermissionsError(OSError):
    pass

class FileAlreadyExists(OSError):
    pass

class FileDoesNotExist(OSError):
    pass

MAPPING = {
    errno.EEXIST : FileAlreadyExists,
    errno.ENOENT : FileDoesNotExist,
    errno.EPERM  : FilePermissionsError
}

def remap(e):
    if e.errno in MAPPING:
        return MAPPING[e.errno]
    return e

# todo: add more exceptions for other OSErrors, like permissions, etc.

def exists(path):
    try:
        return os.path.exists(path)
    except OSError as e:
        raise remap(e)

def common(*paths):
    prefix = os.path.commonprefix(paths)
    if exists(prefix):
        return prefix, [path[len(prefix):] for path in paths]
    return '', paths

@contextmanager
def open(path,mode,stats=0755):
    os.umask(0000)
    flags = 0
    mustlock = False
    mustcopy = False
    if 'b' in mode:
        if hasattr(os,'O_BINARY'):
            flags |= os.O_BINARY
    if 'x' in mode:
        flags |= os.O_EXCL
    if 'r+' in mode:
        flags |= os.O_RDWR
        mustcopy = True
        mustlock = True
    elif 'w+' in mode:
        flags |= os.O_RDWR|os.O_CREAT
        mustlock = True
    elif 'a+' in mode:
        flags |= os.O_CREAT|os.O_APPEND|os.O_RDWR
        mustlock = True
        mustcopy = True
    elif 'w' in mode:
        flags |= os.O_WRONLY|os.O_CREAT
        mustlock = True
    elif 'r' in mode:
        flags |= os.O_RDONLY
    elif 'a' in mode:
        flags |= os.O_CREAT|os.O_APPEND|os.O_WRONLY
        mustlock = True
        mustcopy = True

    sidepath = None

    try:
        if mustlock:
            mkdir(os.path.dirname(path))
            with fslock.FSLock(path+'.updating') as lock:
                sidepath = lock.path
                if mustcopy:
                    if os.path.exists(sidepath):
                        shutil.copy(path,sidepath)
                with os.fdopen(os.open(sidepath,flags,stats),mode) as wfile:
                    yield wfile
                os.rename(sidepath,path)
        else:
            with os.fdopen(os.open(path,flags,stats),mode) as rfile:
                yield rfile
    except OSError, e:
        # catch opaque OSErrors and rethrow as more specific ones
        # this has been implemented in Python 3.3 :-P
        if e.errno == errno.EEXIST: raise FileAlreadyExists(path)
        elif e.errno == errno.ENOENT: raise FileDoesNotExist(path)
        raise e
    finally:
        # if not renamed by this time, delete the sidefile
        remove(sidepath)

