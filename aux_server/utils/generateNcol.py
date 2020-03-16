__doc__ = 'executing this file will render bipartite, weighted, directed (Erdos-Renyi) networks'

import numpy as n


def sNcol(nl1=100, nl2=100, ne=1000, wmax=10, fname='mfile'):
    vv = list(range(nl1 + nl2))
    v1 = vv[:nl1]
    v2 = vv[nl1:]
    l1 = n.random.choice(v1, ne)
    l2 = n.random.choice(v2, ne)
    w = n.random.randint(1, wmax + 1, ne)

    d = n.vstack((l1, l2, w)).T
    n.savetxt(fname + '.ncol', d, '%d')
    return l1, l2, w


def mkThem(tdir='aux_server/data'):
    sNcol(fname=f'{tdir}/mfile')
    sNcol(200, 100, 2000, 10, f'{tdir}/mfile2')
    sNcol(150, 100, 2000, 40, f'{tdir}/mfile3')
    return 0


print(mkThem())
