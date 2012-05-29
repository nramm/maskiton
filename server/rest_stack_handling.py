import os
import json
import shutil
from errno import EPERM, EXDEV, EEXIST, EISDIR

from tornado.web import RequestHandler

import MySQLdb as mysql

with open('config.json','r') as fp:
    CONFIG = json.load(fp)

class DBCursor(object):

    db = None
    cursor = None

    def __enter__(self):
        self.db = mysql.connect(CONFIG['APPION_SERVER'],CONFIG['APPION_USER'],CONFIG['APPION_PASSWORD'])
        self.cursor = self.db.cursor()
        return self.cursor

    def __exit__(self,e,t,s):
        if not e:
            self.db.commit()
        self.db.close()

class StackUpload(RequestHandler):

    def post(self):
        params = json.loads(self.request.body)
        projectid,stackid = rest_insertUploadedStack(params['hedid'],params['imgid'])
        self.set_header('Access-Control-Allow-Origin','*')
        self.write({
            'projectid' : projectid,
            'stackid'   : stackid
        })

def query_one(cursor,query,*args):
    try:
        cursor.execute(query,args)
        result = cursor.fetchone()
        if result and len(result) == 1:
            return result[0]
        return result
    except Exception, e:
        print 'error with sql:',(query%args)
        raise

def rest_insertUploadedStack(hedid,imgid,projectid=CONFIG['APPION_PROJECTID']):
    with DBCursor() as cursor:
        hed = os.path.join(CONFIG['UPLOAD_PATH'],hedid)
        img = os.path.join(CONFIG['UPLOAD_PATH'],imgid)
        projectid,stackid = insertIMAGICStack(cursor,projectid,hed,img)
    return projectid,stackid

def rest_queryStackPath(projectid,stackid):
    print 'querying stack path for:',projectid,stackid
    with DBCursor() as cursor:
        apdb = getAppionDBName(cursor,projectid)
        try:
            pathid,name = query_one(cursor,'''SELECT `REF|ApPathData|path`,name FROM %s.ApStackData
                                              WHERE DEF_id=%%s ORDER BY DEF_id DESC'''%apdb,stackid)
            path = query_one(cursor,'''SELECT (path) FROM %s.ApPathData
                                        WHERE DEF_id=%%s ORDER BY DEF_id DESC'''%apdb,pathid)
            hed = os.path.join(path,name)
            img = hed.replace('.hed','.img')
            return hed, img
        except TypeError:
            return None, None

def getAppionDBName(cursor,projectid):
    return query_one(cursor,'''SELECT appiondb FROM project.processingdb
                               WHERE `REF|projects|project` = %s''',projectid)

def insertIMAGICStack(cursor,projectid,hed,img):
    base = os.path.basename(hed)
    nhed = lncp(hed,os.path.join(CONFIG['STACK_PATH'],base+'.hed'))
    nimg = lncp(img,os.path.join(CONFIG['STACK_PATH'],base+'.img'))
    apdb = getAppionDBName(cursor,projectid)
    dbstack = dbInsertStack(cursor,apdb,nhed)
    return projectid,dbstack[0]

def dbInsertPath(cursor,apdb,path):
    result = dbQueryPath(cursor,apdb,path)
    if not result:
        query_one(cursor,'INSERT INTO %s.ApPathData (path) VALUES (%%s)'%apdb,path)
        result = dbQueryPath(cursor,apdb,path)
        if not result:
            raise IOError
    return result

def dbQueryPath(cursor,apdb,path):
    return query_one(cursor,'SELECT DEF_id,path FROM %s.ApPathData WHERE path=%%s ORDER BY DEF_id DESC'%apdb,path)

def dbQueryStack(cursor,apdb,hed):
    path = os.path.dirname(hed)
    base = os.path.basename(hed)
    dbpath = dbQueryPath(cursor,apdb,path)
    if dbpath:
        return query_one(cursor,'''SELECT * FROM %s.ApStackData
                                    WHERE `REF|ApPathData|path`=%%s
                                     AND name=%%s
                                    ORDER BY DEF_id DESC'''%apdb,dbpath[0],base)
    return None

def dbInsertStack(cursor,apdb,hed):
    dbstack = dbQueryStack(cursor,apdb,hed)
    if not dbstack:
        path = os.path.dirname(hed)
        base = os.path.basename(hed)
        dbpath = dbInsertPath(cursor,apdb,path)
        query_one(cursor,'''INSERT INTO %s.ApStackData (`REF|ApPathData|path`,name)
                             VALUES (%%s,%%s)'''%apdb,dbpath[0],base)
        return dbQueryStack(cursor,apdb,hed)
    return dbstack

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


