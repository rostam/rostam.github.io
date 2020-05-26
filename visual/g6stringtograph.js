/**
 * Created by rostam on 2/11/17.
 * @author M. Ali Rostami
 */
    var BIAS6 = 63;
    var SMALLN = 62;
    var SMALLISHN = 258047;
    var TOPBIT6 = 32;
    var  WORDSIZE = 32;

    var bit_ = [020000000000, 010000000000, 04000000000, 02000000000,
            01000000000, 0400000000, 0200000000, 0100000000, 040000000,
            020000000, 010000000, 04000000, 02000000, 01000000, 0400000,
            0200000, 0100000, 040000, 020000, 010000, 04000, 02000, 01000,
            0400, 0200, 0100, 040, 020, 010, 04, 02, 01];

    function SIZELEN(n) {
        return (n) <= SMALLN ? 1 : ((n) <= SMALLISHN ? 4 : 8);
    }

    function SETWD(pos) {
        return ((pos) >> 5);
    }

    function SETBT(pos) {
        return ((pos) & 037);
    }

    /* Get size of graph out of graph6 or sparse6 string. */
    function graphsize(s) {
        var p;
        if (s.charAt(0).charCodeAt(0) == ':') p = s.substring(1);
        else p = s;
        var n;
        n = p.charAt(0).charCodeAt(0) - BIAS6;
        if (n > SMALLN) {
            n = p.charAt(1) - BIAS6;
            n = (n << 6) | (p.charAt(2).charCodeAt(0) - BIAS6);
            n = (n << 6) | (p.charAt(3).charCodeAt(0) - BIAS6);
        }
        return n;
    }

    function stringToGraphModel(g6) {
        var n = graphsize(g6);
        var elements = [];
        for(var i=0;i<n;i++) elements.push({group: 'nodes', data: { id: 'n'+i, la: ''+i }});
        var p = g6;
        if (g6.charAt(0).charCodeAt(0) == ':' || g6.charAt(0).charCodeAt(0) == '&')
            p = g6.substring(1);
        p = p.substring(SIZELEN(n));

        var m = (n + WORDSIZE - 1) / WORDSIZE;
        var x=0;
        g = [];
        for (var ii = m * n; --ii > 0; ) g[ii] = 0;
        g[0] = 0;
        var k = 1;
        var it = 0;
        for (var j = 1; j < n; ++j) {
            for (var i = 0; i < j; ++i) {
                if (--k == 0) {
                    k = 6;
                    x = p.charAt(it).charCodeAt(0)  - BIAS6;
                    it++;
                }
                if ((x & TOPBIT6) != 0) elements.push({ group: 'edges', data: { id: 'e'+i+"-"+j, source: 'n'+i, target: 'n'+j } });
                x <<= 1;
        }
      }
      return elements;
    }
