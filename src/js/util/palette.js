(function () {

    interpolatePalette = function () {
        var p1 = d3.interpolateRgb(d3.rgb(0,200,255),d3.rgb(0,228,0));
        var p2 = d3.interpolateRgb(d3.rgb(0,228,0),d3.rgb(255,255,0));
        var p3 = d3.interpolateRgb(d3.rgb(255,255,0),d3.rgb(255,126,0));
        var p4 = d3.interpolateRgb(d3.rgb(255,126,0),d3.rgb(255,0,0));
        var p5 = d3.interpolateRgb(d3.rgb(255,0,0),d3.rgb(153,0,76));
        var p6 = d3.interpolateRgb(d3.rgb(153,0,76),d3.rgb(126,0,35));
        var p7 = d3.interpolateRgb(d3.rgb(126,0,35),d3.rgb(126,0,35));
        var interpolateColor = function (value) {
            if(value<0.1)
                return p1(value*10);
            else if(value<0.2)
                return p2((value-0.1)*10);
            else if(value<0.3)
                return p3((value-0.2)*10);
            else  if(value<0.4)
                return p4((value-0.3)*5);
            else if(value<0.6)
                return p5((value-0.6)*5);
            else if(value<0.8)
                return p6((value-0.8)*5);
            else
                return p7((value-0.8)*5);
        };
        return d3.scaleSequential(interpolateColor).domain([0,400]);
    };
'—'

})();