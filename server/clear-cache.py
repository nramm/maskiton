#!/usr/bin/env python

from __future__ import print_function

#    "IMAGE_PATH"        : "/Users/craigyk/Desktop/maskiton/cache/static/images",
#    "IMAGE_URL"         : "static/images",
#    "STACK_PATH"        : "/Users/craigyk/Desktop/maskiton/cache/static/stacks",
#    "UPLOAD_PATH"       : "/Users/craigyk/Desktop/maskiton/cache/uploads",
#    "CACHE_PATH"        : "/Users/craigyk/Desktop/maskiton/cache/processing",
#    "JOB_PATH"          : "/Users/craigyk/Desktop/maskiton/cache/jobs"


def clear_directory(root):
	import os
	import shutil
	
	print('removing {0}'.format(root))
	shutil.rmtree(root)
	os.makedirs(root)


def clear_caches():
	from config import CONFIG
	clear_directory(CONFIG['CACHE_PATH'])
	clear_directory(CONFIG['IMAGE_PATH'])
	clear_directory(CONFIG['STACK_PATH'])
	clear_directory(CONFIG['UPLOAD_PATH'])
	clear_directory(CONFIG['JOB_PATH'])

if __name__ == '__main__':
	clear_caches()
