import os
import re

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