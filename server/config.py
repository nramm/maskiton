
import json

with open('../client/config.json','r') as fp:
    CONFIG = json.load(fp)

with open('config.json','r') as fp:
    CONFIG.update(json.load(fp))


