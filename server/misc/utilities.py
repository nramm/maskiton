
import os
import re
import base64


def prettySize(size):
    '''
    specifies a number in bytes as a string with more helpful units
    '''
    size = float(size)
    if size / (1024**1) < 1:
        return '%dB'%size
    elif size / (1024**2) < 1:
        return '%.2fKB'%(size/(1024**1))
    elif size / (1024**3) < 1:
        return '%.2fMB'%(size/(1024**2))
    elif size / (1024**4) < 1:
        return '%.2fGB'%(size/(1024**3))
    return '%.2fTB'%(size/(1024**4))

def indent(str_block,indent='\t',split_on='\n'):
    return split_on.join([indent+x for x in str_block.split(split_on)])


def prettyRepr(values):
    
    string = ''
    
    nested = [k for k in values if isinstance(values[k],dict)]
    simple = [k for k in values if not isinstance(values[k],dict)]
    
    def hanging_indent(key,lines):
        lines = lines.split('\n')
        toadd = '%s: '%key
        indent = len(toadd)
        toadd += lines[0] + '\n'
        for line in lines[1:]:
            if line == '':
                continue
            toadd += ' '*indent + line + '\n'
        return toadd
    
    for key in simple:
        string += hanging_indent(key,repr(values[key]))
    
    for key in nested:
        string += hanging_indent(key,prettyRepr(values[key]))
    
    return string

def prettyTime(secs):
    if secs < 60:
        return '%.2f secs'%(secs)
    if secs < 60*60:
        return '%.2f mins'%(secs/60)
    if secs < 60*60*24:
        return '%.2f hrs'%(secs/(60*60))
    else:
        return '%.2f days'%(secs/(60*60*24))

def reglob(pattern,strict=False):
    
    def listdir(base):
        try:
            if os.path.isdir(base):
                for filename in os.listdir(base):
                    yield os.path.join(base,filename),filename
        except OSError: # to skip permissions errors
            return
    
    
    def matchnext(bases,part):
        matches = []
        matcher = re.compile(part)
        for base in bases:
            for path,filename in listdir(base):
                if matcher.search(filename):
                    matches += [path]
        return matches
    
    
    if not strict:
        pattern = pattern.replace('.','\.')
        pattern = pattern.replace('*','.*')
    
    
    parts = os.path.abspath(pattern).split('/')
    
    matches = ['/']
    for part in parts[1:]:
        matches = matchnext(matches,'^%s$'%part)
    
    return matches

def parseDataURL(url):
    match = re.match('data:(.+);(.+),',url)
    if match == None:
        return None
    mime = match.group(1)
    encoding = match.group(2)
    data = url[match.end():]
    return mime,encoding,data

def fromDataURL(url):
    mime,encoding,data = parseDataURL(url)
    if encoding == 'base64':
        data = base64.b64decode(data)
    else:
        raise ValueError('url: %s..., has unknown encoding'%(url[:10]))
    return mime,data

def toDataURL(mime,data):
    return "data:%s;base64,%s"%(mime,base64.b64encode(data))


