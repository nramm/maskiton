import os
import re
import subprocess as sp

import numpy as np

from fs import cache, follow, stat

def permute(cache,count):
    permuted = np.random.permutation(count)
    return permuted.tolist()

def splitby(items,splitsize):
    subsets = []
    for i in xrange(0, len(items), splitsize):
        subsets += [items[i:i+splitsize]]
    return subsets

_imagicdims = re.compile(r'(\d+) images.+are (\d+)x(\d+)x(\d+)',re.DOTALL)
def hed_dims(cache,hedpath,imgpath):
    hedpath = cache.fs.ln(hedpath,'stack.hed')
    imgpath = cache.fs.ln(imgpath,'stack.img')
    results = sp.check_output(['iminfo',hedpath])
    matches = _imagicdims.search(results)
    if matches:
        return (int(matches.group(1)),
                int(matches.group(2)),
                int(matches.group(3)))
    raise ValueError('could not determine dimensions for imagic stack: %s'%path)

stdnull = open('/dev/null','w')
def cli(args,stdout=stdnull,stderr=stdnull):
    try:
        return sp.check_call(args,stdout=stdout,stderr=stderr)
    except sp.CalledProcessError, e:
        print 'ERROR in cli:'
        print '  ',' '.join(args)
        raise

def cli_r(args,stderr=stdnull):
    return sp.check_result(args,stderr=stderr)

def hed2sel(cache,hed,img,nums=None):
    spis = cache(hed2spis,hed,img,nums)
    return cache(spis2sel,spis)

def hed2spis(cache,hed,img,nums=None):
    hed  = cache.fs.ln(hed,'stack.hed')
    img  = cache.fs.ln(img,'stack.img')
    spis = cache.fs.mkdir('stack')
    args = ['proc2d',hed,spis,'spider-single']
    if nums:
        keep = cache.fs.pathto('keep.txt')
        with cache.fs.open(keep,'wb') as keepf:
            np.savetxt(keepf,np.sort(nums),fmt='%d')
        args += ['list=%s'%keep]
    cli(args)
    return spis

def spis2sel(cache,spis):
    sel = cache.fs.pathto('stack.sel')
    with cache.fs.open(sel,'wb') as fsel:
        cli(['xmipp_selfile_create','%s*spi'%spis],stdout=fsel)
    return sel

def sel_reduce(cache,sel,level):
    spis = cache.fs.mkdir('reduced.%d'%level)
    if level == 1: return sel
    osel = cache(sel_reduce,sel,level-1)
    cli(['xmipp_scale_pyramid','-i',osel,'-oroot',spis,'-reduce'])
    return cache(spis2sel,spis)

def hed2sel_pyramid(cache,hed,img,levels=1,splitsize=200):
    count,_,_ = cache(hed_dims,hed,img)
    permuted  = cache(permute,count)
    subsets   = splitby(permuted,splitsize)
    total     = len(subsets) - 1
    for i,subset in enumerate(subsets):
        osel = cache(hed2sel,hed,img,subset)
        sels = []
        for level in xrange(1,levels+1):
            sels += [cache(sel_reduce,osel,level)]
        yield i,total,sels

def basename(path):
    base = os.path.basename(path)
    dirc = os.path.dirname(path)
    return os.path.join(dirc,base.split('.')[0])

def running_average(cache,addspi,count=0,sum=None,avg=None):
    if not addspi:
        return count,sum,avg
    if not sum:
        sum = cache.fs.pathto('running.sum.spi')
        cli(['cp',addspi,sum])
    else:
        cli(['xmipp_operate','-i',sum,'-plus',addspi,'-o',sum])
    if not avg:
        avg = cache.fs.pathto('running.avg.spi')
    count += 1
#    print 'running average'
#    print '   count:',count
#    print '     new:',addspi
#    print '     sum:',sum
#    print '     avg:',avg
    cli(['xmipp_operate','-i',sum,'-divide',str(count),'-o',avg])
    return count,sum,avg

def sel_average(cache,sel):
    if sel is None: return None
    cli(['xmipp_average','-i',sel,'-dont_apply_geo','-only_avg'])
    return cache.fs.mv(basename(sel)+'.xmp','average.spi')

def hed_average(cache,hed,img):
    count,sum,avg = 0,None,None
    with cache.stat as status:
        status['total']   = None
        status['done']    = None
        status['avg.spi'] = None
    for i,t,sels in follow(hed2sel_pyramid,hed,img):
        _avg = cache(sel_average,sels[0])
        count,sum,avg = cache(running_average,_avg,count,sum,avg)
        print 'average iter',i,t,avg
        with cache.stat as status:
            status['total']   = t
            status['done']    = i
            status['avg.spi'] = avg
    return avg

def hed_average_status(hed,img,splitsize):
    return status(hed_average,hed,img,splitsize)

def png2mask(cache,png):
    import PIL.Image
    img = PIL.Image.open(png)
    img = img.convert('L')
    png = cache.fs.pathto('mask.png')
    spi = cache.fs.pathto('mask.spi')
    img.save(png)
    cli(['proc2d',png,spi,'spider-single'])
    return spi

def spi_dims(cache,spi):
    results = sp.check_output(['iminfo',spi])
    matches = re.search('(\d+)x(\d+)',results)
    return map(int,matches.groups())

def sel_dims(cache,sel):
    with open(sel,'r') as src:
        spi,_ = src.readline().split(' ')
        rows,cols = cache(spi_dims,spi)
        count = 1
        for line in src:
            if line.split()[1] == '1': count += 1
    return (count,rows,cols)

def shift_avgs(cache,avgs):
    navgs = {}
    for cluid in avgs:
        _,_,avg = avgs[cluid]
        navgs[cluid] = cache(running_average,avg)
    return navgs

def shift_sels(cache,sels):
    return {}

def merge_sels(cache,sels,csels):
    nsels = {}
    for cluid in sels:
        if sels[cluid] is not None:
            if cluid not in csels:
                nsels[cluid] = cache.fs.cp(sels[cluid],'class.%d.sel'%int(cluid))
            else:
                os.system('cat %s >> %s'%(sels[cluid],csels[cluid]))
                nsels[cluid] = csels[cluid]
    return nsels

def merge_avgs(cache,spis,avgs):
    navgs = {}
    for cluid in spis:
        if cluid not in avgs:
            navgs[cluid] = cache(running_average,spis[cluid])
        else:
            navgs[cluid] = cache(running_average,spis[cluid],*avgs[cluid])
    return navgs

def parse_sel(cache,sel):
    spis = []
    with open(sel,'r') as src:
        for line in src:
            spi,keep = line.split()
            if keep == '1':
                spis += [spi]
    return spis

def cluster2sel(cache,cluster,spis):
    if not os.path.exists(cluster):
        return None
    nsel = cache.fs.pathto('cluster.sel')
    with open(cluster,'r') as src:
        nums = map(int,src.readlines())
    if len(nums) == 0:
        return None
    with open(nsel,'w') as dst:
        for num in nums:
            dst.write('%s 1\n'%(spis[num]))
    return nsel

def sel_som(cache,dat,xdim=5,ydim=4,cvin=None,iters=None,radius=None,alpha=None):

    code = cache.fs.pathto('classes.cod')
    root = cache.fs.pathto('classes')
    args = ['xmipp_classify_som',
            '-i',dat,
            '-o',root,
            '-rect',
            '-saveclusters',
            '-randomcodevectors']
    if alpha  : args += ['-alpha',str(alpha)]
    if radius : args += ['-radius',str(radius)]
    if iters  : args += ['-iter',str(iters)]
    if cvin   : args += ['-cvin',cvin]
    if xdim   : args += ['-xdim',str(xdim)]
    if ydim   : args += ['-ydim',str(ydim)]
    cli(args)

    clusters = {}
    for cluid in range(xdim*ydim):
        clusters[cluid] = cache.fs.pathto('classes.%d'%cluid)

    return code, clusters

def clusters2sels(cache,clusters,sel):
    sels = {}
    avgs = {}
    spis = cache(parse_sel,sel)
    for cluid in clusters:
        sels[cluid] = cache(cluster2sel,clusters[cluid],spis)
        avgs[cluid] = cache(sel_average,sels[cluid])
    return sels, avgs

def clusterIdToXY(xdim,ydim,cid):
    x = int(cid) % int(xdim)
    y = int(cid) / int(xdim)
    return x, y

def hed_som(cache,hed,img,mask,xdim,ydim,radius,levels,iters,alpha):
    avgs  = {}
    sels  = {}
    cvin  = None
    odims = None
    avgsm = [[None for x in range(xdim)] for y in range(ydim)]
    mask  = cache(png2mask,mask)

    with cache.stat as stat:
        stat['total'] = None
        stat['done'] = None

    for level in xrange(levels,0,-1):
        avgs = cache(shift_avgs,avgs)
        sels = cache(shift_sels,sels)
        for i,t,lsels in follow(hed2sel_pyramid,hed,img,levels):
            print 'som level:',level,'part:',i,'of:',t
            sel = lsels[level-1]
            dims = cache(sel_dims,sel)[1:]
            dat = cache(sel2dat,sel,mask)
            if not odims: odims = dims
            cvin = cache(scale_cod,cvin,mask,odims,dims)
            odims = dims
            cvin,clusters = cache(sel_som,dat,xdim,ydim,cvin,iters,radius,alpha)
            csels,spis = cache(clusters2sels,clusters,lsels[0])
            avgs = cache(merge_avgs,spis,avgs)
            sels = cache(merge_sels,csels,sels)
            for cluid,sel in sels.items():
                if sel: cache.fs.ln(sel,'class.%d.sel'%cluid)
            for cluid,(_,_,avg) in avgs.items():
                if avg: cache.fs.ln(avg,'class.%d.spi'%cluid)
            for cluid in avgs:
                x,y = clusterIdToXY(xdim,ydim,cluid)
                avgsm[y][x] = avgs[cluid][2]
            with cache.stat as stat:
                stat['done']  = (levels-level)*t+i
                stat['total'] = levels*t
                stat['avgs']  = avgsm

def scale_cod(cache,cod,mask,odims,ndims):

    if not cod: return None
    if odims == ndims: return cod

    #print 'scaling code:',cod,'from:',odims,'to:',ndims

    spis = cache.fs.mkdir('scaled')
    ncod = cache.fs.pathto('scaled.cod')
    dat = cache.fs.pathto('scaled.dat')
    sel = cache.fs.pathto('scaled.sel')

    args = ['xmipp_convert_data2img',
            '-i',cod,
            '-o',sel,
            '-imgName',spis]
    if not mask:
        args += ['-nomask',
                 '-rows',str(odims[0]),
                 '-cols',str(odims[1])]
    else:
        nmask = cache(scale_spi,mask,odims)
        args += ['-mask',nmask]
    cli(args)

    with open(sel,'rb') as src:
        print src.read()

    cli(['xmipp_scale','-i',sel,'-xdim',str(ndims[1]),'-ydim',str(ndims[0])])

    dat = cache(sel2dat,sel,mask)

    with open(cod,'r') as src1:
        with open(dat,'r') as src2:
            with open(ncod,'w') as dst:
                vecsize = src2.readline().split()[0]
                vechead = src1.readline().split()[1:]
                dst.write('%s %s\n'%(vecsize,' '.join(vechead)))
                for vec in src2:
                    dst.write('%s'%vec)

    return ncod

def scale_spi(cache,spi,shape):
    if not spi: return None
    rows,cols = shape
    nspi = cache.fs.pathto('scaled.%dx%d.spi'%(rows,cols))
    cli(['xmipp_scale','-i',spi,
                       '-o',nspi,
                       '-ydim',str(rows),
                       '-xdim',str(cols),
                       '-linear'])
    return nspi

def sel2dat(cache,sel,mask):
    dat = cache.fs.pathto('masked.dat')
    args = ['xmipp_convert_img2data','-i',sel,'-o',dat,'-dont_apply_geo']
    if mask:
        dims = cache(sel_dims,sel)
        mask = cache(scale_spi,mask,dims[1:])
        print 'mask file:',mask
        args += ['-mask',mask]
    else:
        args += ['-nomask']
    cli(args)
    return dat




