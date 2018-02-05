
(function () {
    CarDriveLayer = function (option) {
        var _ = {
            data:null,
            canvas:null,
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

    CarDriveLayer.prototype.initLayer = function () {
        var palette = interpolatePalette();
        this.set('palette',palette);
    };

    CarDriveLayer.prototype.configLayer = function (option) {
        var canvas = document.createElement('canvas');
        canvas.width = option.map.getSize().width;
        canvas.height = option.map.getSize().height;
        canvas.style.position = 'absolute';
        option.layerOption = canvas;
        this.set('style',option.style);
        this.set('onclick',option.onclick);
        this.prototype.configMap(this,option.map,option);
    };

    CarDriveLayer.prototype.render = function () {
        console.log('render');
        var self = this.tag || this;
        if(self === null)
            return;
        if (!self.get("data")) {
            return;
        }
        var canvas = self.get('canvas');
        var context = canvas.getContext("2d");
        var map = self.get('map');
        var style = self.get('style');
        var palette = self.get('palette');
        var data = self.get('data');
        var onclick = self.get('onclick');

        self.prototype.resizeMap();
        context.clear();
        //设置标志物
        for(var i = 0;i<data.length;i++){
            var d = data[i];
            var point = map.lnglatToPoint([d.lng,d.lat]);

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

    CarDriveLayer.prototype.update = function (data) {
        this.set('data',data);
        this.render();
    };
})();