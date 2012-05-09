
define [], ->
    
    hue2rgb = (m1,m2,h) ->
        h = if h < 0 then h + 1 else ( if h > 1 then h - 1 else h )
        if h * 6 < 1 then return m1 + (m2 - m1) * h * 6
        if h * 2 < 1 then return m2
        if h * 3 < 2 then return m1 + (m2 - m1) * (0.66666 - h) * 6
        return m1

    cssrgba : (rgba) ->
        r = Math.round rgba[0]
        g = Math.round rgba[1]
        b = Math.round rgba[2]
        if rgba.length == 4 then "rgba(#{r},#{g},#{b},#{rgba[3]})"
        else "rgb(#{r},#{g},#{b})"

    hsl2rgb : (hsl) ->
        [h,s,l] = hsl
        m2 = if l <= 0.5 then (l*(s+1)) else (l+s-l*s)
        m1 = l * 2 - m2
        return [hue2rgb(m1, m2, h+0.33333)*255
                hue2rgb(m1, m2, h)*255
                hue2rgb(m1, m2, h-0.33333)*255]

    rgb2hsl : (rgb) ->
        
        [r,g,b] = (x/255 for x in rgb)
        
        min = Math.min(r, Math.min(g, b))
        max = Math.max(r, Math.max(g, b))
        delta = max - min
        l = (min + max) / 2
        
        s = 0
        if l > 0 and l < 1
            s = delta / (if l < 0.5 then (2*l) else (2-2*l))
        
        h = 0;
        if delta > 0
            if max == r and max != g then h += (g - b) / delta
            if max == g and max != b then h += (2 + (b - r) / delta)
            if max == b and max != r then h += (4 + (r - g) / delta)
            h /= 6
        
        return [h, s, l];
    

