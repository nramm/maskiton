import os
import json
import shutil
from errno import EPERM, EXDEV, EEXIST, EISDIR

from tornado.web import RequestHandler

with open('config.json','r') as fp:
    CONFIG = json.load(fp)

if 'APPION_SERVER' in CONFIG:
    from rest_stack_handling_appion import rest_insertUploadedStack, rest_queryStackPath
else:
    from rest_stack_handling_file import rest_insertUploadedStack, rest_queryStackPath

class StackUpload(RequestHandler):

    def post(self):
        params = json.loads(self.request.body)
        projectid,stackid = rest_insertUploadedStack(params['hedid'],params['imgid'])
        self.set_header('Access-Control-Allow-Origin','*')
        self.write({
            'projectid' : projectid,
            'stackid'   : stackid
        })

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

