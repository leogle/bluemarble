(function () {
    MarkerLayer = function (option) {
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

    MarkerLayer.prototype.initLayer = function () {
        var palette = interpolatePalette();
        this.set('palette',palette);
    };

    MarkerLayer.prototype.configLayer = function (option) {
        var element = document.createElement('div');
        element.width = option.map.getSize().width;
        element.height = option.map.getSize().height;
        element.style.position = 'absolute';
        option.layerOption = element;
        this.set('element',element);
        this.set('map',option.map);
        this.set('style',option.style);
        this.set('onclick',option.onclick);
        this.prototype.configMap(this,option.map,option);
    };

    MarkerLayer.prototype.render = function () {
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
        var data = self.get('data');
        var onclick = self.get('onclick');
        while(element.hasChildNodes()){
            element.removeChild(element.firstChild);
        }
        self.prototype.resizeMap();
        //设置标志物
        for(var i = 0;i<data.length;i++){
            var d = data[i];
            var point = map.lnglatToPoint([d.lng,d.lat]);
            var div = document.createElement('div');
            div.style.top = point.y +'px';
            div.style.left= point.x +'px';
            div.style.position = 'absolute';
            //div.style.background = palette(d.value);
            style = "<div class='marker' style='background:" +palette(d.value)+
                "'>{{value}}</div><div class='marker-label'>{{name}}</div>";
            style = style.replace("{{value}}",d['value']);
            style = style.replace("{{name}}",d['name']);
            div.innerHTML = style;
            div.tag = d;
            div.addEventListener("click", function(e){
                onclick(e);
            });
            //div.onclick = onclick(d);
            element.appendChild(div);
        }
    };

    MarkerLayer.prototype.update = function (data) {
        this.set('data',data);
        this.render();
    };
})();