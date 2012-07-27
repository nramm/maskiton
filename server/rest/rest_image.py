
import os
import re
import glob
import json
import hashlib
import subprocess as sp

from tornado.gen import Task, engine
from tornado.web import RequestHandler, asynchronous

from misc import fromDataURL

with open('config.json','r') as fp:
    CONFIG = json.load(fp)

mime_to_ext = {
    'image/jpeg'   : '.jpg',
    'image/tiff'   : '.tiff',
    'image/png'    : '.png',
    'image/spider' : '.spi',
}

ext_to_mime = {
    '.jpg'  : 'image/jpeg',
    '.png'  : 'image/png',
    '.tiff' : 'image/tiff',
    '.spi'  : 'image/spider',
    '.xmp'  : 'image/spider',
}

def pathFromId(imageid,mime=None,ext=None):
    if ext == None: ext = mime_to_ext[mime]
    return os.path.join(CONFIG['IMAGE_PATH'],imageid+ext)

def urlFromId(imageid,mime=None,ext=None):
    if ext == None: ext = mime_to_ext[mime]
    url = os.path.join(CONFIG['STATIC_SERVER'],CONFIG['IMAGE_URL'])
    url = os.path.join(url,imageid+ext)
    return url

def idFromURL(url):
    parts = os.path.basename(url).split('.')
    return parts[0]

def hashFile(src):
    hasher = hashlib.md5()
    while True:
        data = src.read(16384)
        if not data: break
        hasher.update(data)
    return hasher.hexdigest()

def rest_saveImagePath(path):
    if not path:
        return None
    _,ext = os.path.splitext(path)
    with open(path,'rb') as src:
        hashid = hashFile(src)
    dstpath = pathFromId(hashid,ext='.png')
    if not os.path.exists(dstpath):
        with open('/dev/null','wb') as null:
            sp.check_call(['proc2d',path,dstpath],stdout=null,stderr=null)
    return urlFromId(hashid,ext='.png')

def rest_saveImageDataURL(dataurl,callback):
    mime,data = fromDataURL(dataurl)
    hashid = hashlib.md5(data).hexdigest()
    path = pathFromId(hashid,mime=mime)
    if not os.path.exists(path):
        with open(path,'wb') as dst:
            dst.write(data)
    url = urlFromId(hashid,mime=mime)
    callback(url)
    return url

class ImageUpload(RequestHandler):

    @asynchronous
    @engine
    def post(self):
        url = yield Task(rest_saveImageDataURL,self.request.body)
        self.set_header('Access-Control-Allow-Origin','*')
        status = {
            'url' : url,
            'id'  : idFromURL(url)
        }
        self.write(status)
        self.finish()

    def options(self):
        self.set_header('Access-Control-Allow-Origin','*')




