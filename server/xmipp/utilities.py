
import os
import re
import numpy as np

from rest_misc import reglob

def progressFromXMIPPLog(path):
    progress = '...'
    try:
        lines = re.split('[\n\r]',readLastN(path,256))
        for line in lines[::-1]:
            matches = re.search('([0-9.]+)[ ]*/[ ]*([0-9.]+)',line)
            if matches:
                elapsed = float(matches.group(1))
                estimated = float(matches.group(2))
                if elapsed != 0 and estimated != 0:
                    progress = elapsed/estimated
    except:
        progress = '...'
    return progress


def readLastN(path,count):
    with open(path,'r') as fid:
        fid.seek(0,2)
        size = fid.tell()
        fid.seek(max(0,size-count))
        return fid.read()


def parseDatFile(path,keepvecs=False):
    vecs = []
    paths = []
    with open(path,'r') as fid:
        _ = fid.readline()
        for line in fid.readlines():
            parts = line.rstrip().split(' ')
            if len(parts) == 0:
                continue
            vecs += [parts[:-1]]
            paths += [parts[-1]]
    return vecs,paths


def moveSelFile(selpath,dstpath,allimage=False):
    selpath = os.path.abspath(selpath)
    dstpath = os.path.abspath(dstpath)
    srcbasepath = os.path.dirname(selpath)
    dstbasepath = os.path.dirname(dstpath)
    seldata = openSelFile(selfpath,allimages)
    for i,item in enumerate(seldata):
        item[0] = os.path.relpath(os.path.join(srcbasepath,item[0]),dstbasepath)
    saveSelFile(seldata,dstpath)


def saveSelFile(selfile,savepath,append=False,saveall=True):
    mode = 'a' if append else 'w'
    dirpath = os.path.dirname(savepath)
    if not os.path.exists(dirpath):
        os.makedirs(dirpath)
    with open(savepath,mode) as outfile:
        for path,keep in selfile:
            path = os.path.abspath(path)
            if saveall or keep:
                outfile.write("%s %d\n"%(path,1 if keep else -1))


def openSelFile(selpath,allimages=True):
    seldata = []
    basepath = os.path.dirname(selpath)
    with open(selpath,'r') as src:
        for i,line in enumerate(src):
            try:
                path,keep = line.split(' ')
                keep = int(keep) == 1
                if allimages or keep:
                    path = os.path.join(basepath,path)
                    seldata += [[path,keep]]
            except Exception as ex:
                print '[warning] skipped line: %d in: %s'%(i,selpath)
    return seldata


def createSelFile(pattern,selpath,append=False):
    paths = reglob(pattern)
    seldata = [(path,True) for path in paths]
    saveSelFile(seldata,selpath,append)


def splitSelFile(selpath,dstrootpath,increments,keepall=False,cummulative=False,randomize=True):
    
    seldata = openSelFile(selpath,allimages=keepall)
    
    if randomize:
        permute = np.random.permutation(len(seldata))
        seldata = [seldata[x] for x in permute]
    
    dstselpaths = []
    for i in range(increments):
        start = 0
        if not cummulative:
            start = int((float(i)/increments)*len(seldata))
        end = int((float(i+1)/increments)*len(seldata))
        dstpath = dstrootpath+'_%d.sel'%i
        saveSelFile(seldata[start:end],dstpath)
        dstselpaths += [dstpath]
    
    return dstselpaths


def selStackSize(selpath):
    seldata = openSelFile(selpath,allimages=False)
    if os.path.exists(seldata[0][0]):
        imgsize = os.path.getsize(seldata[0][0])
        return imgsize * len(seldata)
    return None


def clusters2sels(datpath,clusterpaths,selroot):
    _,paths = list(parseDatFile(datpath))
    selpaths = []
    for i,clusterpath in enumerate(clusterpaths):
        selpath = selroot+'_%d.sel'%i
        seldata = []
        with open(clusterpath,'r') as src:
            for i,line in enumerate(src.readlines()):
                num = int(line.strip())
                seldata += [(paths[num],True)]
        saveSelFile(seldata,selpath)
        selpaths += [selpath]
    return selpaths


















