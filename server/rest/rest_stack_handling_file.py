import os
import json
import shutil
from errno import EPERM, EXDEV, EEXIST, EISDIR

from tornado.web import RequestHandler

with open('config.json','r') as fp:
    CONFIG = json.load(fp)

def rest_insertUploadedStack(hedid,imgid,projectid=0):
    hed = os.path.join(CONFIG['UPLOAD_PATH'],hedid)
    img = os.path.join(CONFIG['UPLOAD_PATH'],imgid)
    base = os.path.basename(hed)
    nhed = lncp(hed,os.path.join(CONFIG['STACK_PATH'],base+'.hed'))
    nimg = lncp(img,os.path.join(CONFIG['STACK_PATH'],base+'.img'))
    return projectid,base

def rest_queryStackPath(projectid,stackid):
    hedpath = os.path.join(CONFIG['STACK_PATH'],stackid+'.hed')
    imgpath = os.path.join(CONFIG['STACK_PATH'],stackid+'.img')
    return hedpath,imgpath

def ls(path):
    for _path in os.listdir(path):
        yield os.path.abspath(os.path.join(path,_path))

def pathto(path):
    path = os.path.abspath(path)
    mkdir(os.path.dirname(path))
    return path

def mkdir(path):
    if path not in [None,'']:
        if not os.path.exists(path):
            os.makedirs(path)
    return path

def lncp(src,dst,sym=False):
    if os.path.exists(dst):
        return dst
    dst = pathto(dst)
    try:
        try: os.link(src,dst)
        except OSError, e:
            if e.errno not in [EXDEV,EPERM]: raise
            try:
                if sym: os.symlink(src,dst)
                else: shutil.copy(src,dst)
            except IOError, e:
                if e.errno not in [EISDIR]: raise
                mkdir(dst)
                for _src in ls(src):
                    _dst = os.path.join(dst,_src.replace(src,''))
                    lncp(_src,_dst)
    except OSError, e:
        if e.errno != EEXIST: raise
    return dst

