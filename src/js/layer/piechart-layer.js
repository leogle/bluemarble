(function () {
    PiecharLayer = function (option) {
        var _ = {
            data:null,
            element:null,
            map:null,
            style:null,
            palette:null,
        };

        this.get = function (key) {
            return _[key];
        };
        this.set = function (key, value) {
            _[key] = value;
        };

        this.prototype = new LayerBase();
        this.configLayer(option);
        this.initLayer();
    };

    PiecharLayer.prototype.initLayer = function () {
        var palette = interpolatePalette();
        this.set('palette',palette);
    };

    PiecharLayer.prototype.configLayer = function (option) {
        var element = document.createElement('div');
        var size = option.map.getSize();
        element.width = size.width;
        element.height = size.height;
        element.style.position = 'absolute';

        var svg = document.createElement('svg');
        svg.id = "pichartSvg";
        svg.setAttribute("width",size.width+"px");
        svg.setAttribute("height",size.height+"px");
        svg.style.width = option.map.getSize().width+"px";
        svg.style.height = option.map.getSize().height+"px";
        svg.style.position = 'absolute';
        element.appendChild(svg);

        option.layerOption = element;
        this.set('element',element);
        this.set('map',option.map);
        this.set('style',option.style);
        this.set('onclick',option.onclick);
        this.prototype.configMap(this,option.map,option);
    };

    PiecharLayer.prototype.render = function () {
        console.log('render');
        var self = this.tag || this;
        if(self === null)
            return;
        if (!self.get("data")) {
            return;
        }
        var element = self.get('element');
        var map = self.get('map');
        var style = self.get('style');
        var palette = self.get('palette');
        var onclick = self.get('onclick');
        while(element.firstChild.hasChildNodes()){
            element.firstChild.removeChild(element.firstChild.firstChild);
        }
        self.prototype.resizeMap();
        //设置标志物
        var svg = d3.select('svg#pichartSvg');
        svg.selectAll("g").append("g")
            .append("g")
            .data(data)
            .enter()
            .append('circle')
            .attr("cx",function (d) {
                var point = map.lnglatToPoint([d.lng,d.lat]);
                return point.x;
            })
            .attr('cy',function (d) {
                var point = map.lnglatToPoint([d.lng,d.lat]);
                return point.y;
            })
            .attr('style','position:absolute')
            .attr("r",function (d) {
                return d.value;
            })
            .attr('fill',function (d) {
                return palette(d.value);
            });
    };

    PiecharLayer.prototype.update = function (data) {
        this.set('data',data);
        this.render();
    };
})();