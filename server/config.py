
import json

with open('../client/config.json','r') as fp:
    CONFIG = json.load(fp)
    CONFIG["IMAGE_PATH"]  = "/root/assets/static/images"
    CONFIG["IMAGE_URL"]   = "static/images"
    CONFIG["STACK_PATH"]  = "/root/assets/static/stacks"
    CONFIG["UPLOAD_PATH"] = "/root/assets/cached/uploads"
    CONFIG["CACHE_PATH"]  = "/root/assets/cached/processing"
    CONFIG["JOB_PATH"]    = "/root/assets/cached/jobs"
    # we aren't going to route stack requests trough an appion DB, so this goes here.
    #CONFIG["APPION_SERVER"]    = "mysqldb host"
    #CONFIG["APPION_USER"]      = "username"
    #CONFIG["APPION_PASSWORD"]  = "password"
    #CONFIG["APPION_PROJECTID"] = 353 # appion projectid for maskiton data

