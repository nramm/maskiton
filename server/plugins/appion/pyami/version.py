#!/usr/bin/env python

import os
import re
import inspect
import subprocess

def getInstalledLocation():
	'''where is this module located'''
	# full path of this module
	this_file = inspect.currentframe().f_code.co_filename
	fullmod = os.path.abspath(this_file)
	# just the directory
	dirname = os.path.dirname(fullmod)
	return dirname

def getSubverionRevision(filename=None):
	if filename is None:
		dirname = getInstalledLocation()
	elif os.path.isfile(filename):
		dirname = os.path.dirname(os.path.abspath(filename))
	else:
		dirname = os.path.abspath(filename)
	#print "DIRNAME: ", dirname
	svndir = os.path.join(dirname, ".svn")
	if not os.path.isdir(svndir):
		return None

	### try 1: use svnversion
	cmd = "svnversion"
	if dirname is not None:
		cmd += " "+dirname
	proc = subprocess.Popen(cmd, shell=True, 
		stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	proc.wait()
	line = proc.stdout.readline()
	rev = line.strip()
	if re.match('[0-9]', rev):
		return "r"+rev

	### try 2: use svn info
	cmd = "svn info"
	if dirname is not None:
		cmd += " "+dirname
	proc = subprocess.Popen(cmd, shell=True, 
		stdout=subprocess.PIPE, stderr=subprocess.PIPE)
	proc.wait()
	for line in proc.stdout:
		line = line.strip()
		if not line.startswith('Revision:'):
			continue
		rev = re.sub('Revision:', '', line).strip()
		return "r"+rev

	### try 3: use fourth line from entries file
	entries = os.path.join(dirname, ".svn/entries")
	if os.path.isfile(entries):
		f = open(entries, "r")
		f.readline()
		f.readline()
		f.readline()
		line = f.readline()
		rev = line.strip()
		return "r"+rev
	return None

if __name__ == "__main__":
	rev = getSubverionRevision()
	print "Revision: %s"%(rev)
