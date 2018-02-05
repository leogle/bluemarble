(function () {
    GridWindLayer = function (options) {
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

    GridWindLayer.prototype.configLayer = function (option) {
        this.set('map',option.map);

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
    GridWindLayer.prototype.initLayer = function(){
        var self = this;
        self.set('windy',new GridWind({
            canvas: self.get('canvas'),
            map:self.get('map')
        }));
    };

    GridWindLayer.prototype.render = function () {
        var self = this.tag || this;
        if(self === null)
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

    GridWindLayer.prototype.update = function (data) {
        var self = this.tag || this;
        self.set('data',data);
        var wind = self.get('windy');
        wind.update(data);
        self.render();
    };
/*
    GridWindLayer.prototype.update = function (data) {
        var render = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        var datas = data || this.get("data");
        //初始化GFS格点数据
        var uData = datas[0].data;
        var vData = datas[1].data;
        var header = datas[0].header;

        var λ0 = header.lo1,
            φ0 = header.la1;
        var Δλ = header.dx,
            Δφ = header.dy;
        var ni = header.nx,
            nj = header.ny;

        var grid = [],
            p = 0;
        var isContinuous = Math.floor(ni * Δλ) >= 360;
        for (var j = 0; j < nj; j++) {

            var row = [];
            for (var i = 0; i < ni; i++, p++) {
                row[i] = [uData[p], vData[p]];
                grid.push([λ0+Δλ*i,φ0-Δφ*j,uData[p],vData[p]]);
            }
            if (isContinuous) {
                row.push(row[0]);
            }
        }
        this.set('data',grid);
        this.render();
    };
*/
    GridWindLayer.prototype.invertLatLon = function() {
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