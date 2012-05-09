
import re
import sys
import subprocess as sp


def parse_sel(sel):
    spis = []
    with open(sel,'r') as src:
        for line in src:
            spi,keep = line.split()
            if keep == '1':
                spis += [spi]
    return spis


def spi_dims(spi):
    results = sp.check_output(['iminfo',spi])
    matches = re.search('(\d+)x(\d+)',results)
    return map(int,matches.groups())

if __name__ == '__main__':
    spis = parse_sel(sys.argv[1])
    shapes = []
    for spi in spis:
        shape = spi_dims(spi)
        print spi,':',shape

