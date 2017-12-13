(function () {
    WindLayer = function (options) {
        var _ = {
            canvas:null,
            physicalLayer:null,
            map:null,
            windy:null
        };

        this.get = function (key) {
            return _[key];
        };

        this.set = function (key, value) {
            _[key] = value;
        };
      this.prototype = new LayerBase();
      this.configLayer(options);
      this.initLayer();
    };

    WindLayer.prototype.configLayer = function (option) {
        this.set('map',option.map);
        this.set('radius',option.radius||5000);
        this.set('dataLength',option.dataLength||2000);

        var canvas = document.createElement('canvas');
        canvas.id = "windCanvas";
        canvas.width = map.getSize().width;
        canvas.height = map.getSize().height;
        canvas.style.position = 'absolute';
        canvas.style.top = 0;
        canvas.style.left = 0;
        option.canvas = canvas;
        option.layerOption = canvas;
        this.set('canvas',option.canvas);
        var layer = this.prototype.configMap(this,option.map,option);
        this.set('physicalLayer',layer);

    };

    /**
     * 初始化图层
     */
    WindLayer.prototype.initLayer = function(){
        var self = this;
        self.set('windy',new Windy({
            canvas: self.get('canvas')
        }));
    };

    WindLayer.prototype.render = function () {
        var self = this.tag || this;
        if(self == null)
            return;
        if (!self.get("data")) {
            return;
        }
        //var canvas = self.get('canvas');
        var windy = self.get('windy');
        self.prototype.resizeMap();
        /*
        var bounds = map.getBounds(); //返回当前视口的西南纬度/经度和东北纬度/经度
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        var py = map.pointToOverlayPixel(new BMap.Point(sw.lng, ne.lat)); //经纬度转成屏幕坐标
        canvas.style.left = py.x + 'px';
        canvas.style.top = py.y + 'px';

        var points = this.invertLatLon(py); //所有站点经纬度转为canvas坐标
        var min = map.pointToOverlayPixel(new BMap.Point(sw.lng, ne.lat));
        var max = map.pointToOverlayPixel(new BMap.Point(ne.lng, sw.lat));
*/
        var points = self.invertLatLon();
        console.log(points);
        var size = map.getSize();
        windy.start([
            [0, 0],
            [size.width, size.height]
        ], points);
    };

    WindLayer.prototype.update = function (data) {
        this.set('data',data);
        this.render();
    };

    WindLayer.prototype.invertLatLon = function() {
        var points = [];
        var map = this.get('map');
        this.get('data').forEach(function(station) {
            var px = map.lnglatToPoint([station[1], station[0]]);
            points.push({
                x: px.x,
                y: px.y,
                angle: station[2],
                speed: station[3]
            });
        });
        return points;
    };
})();