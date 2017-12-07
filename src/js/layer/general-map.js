(function () {
    /**
     * 通用地图 屏蔽地图差异性
     * @param option {map,type}
     * @constructor
     */
    GeneralMap = function (option) {
        var _={
            map:null,
            type:'baidu',
            mapTypes : ['baidu','amap','tmap','google'],
            element:null
        };

        this.get = function (key) {
            return _[key];
        };
        this.set = function (key, value) {
            _[key] = value;
        };
        this.init(option);
    };

    /**
     * 初始化函数
     * @param option {map,type}
     */
    GeneralMap.prototype.init = function (option) {
        //var array = this.get('mapTypes');
        var mapType = option.type;
        this.set('type',mapType);
        this.set('map',option.map);
    };

    /**
     * 创建自定义图层
     * @param option
     * @returns {map}
     * @constructor
     */
    GeneralMap.prototype.createCustomLayer = function (option) {
        var mapType = this.get('type');
        var layer;
        if(mapType === 'baidu'){
            layer =  new BMap.Overlay();
            layer.option = option;

        }else if(mapType === 'amap'){
            layer = new AMap.CustomLayer(option);
        }
        else if(mapType === 'tmap'){
            CustomOverlay = T.Overlay.extend({
                initialize:function () {
                    
                }
            });
            layer = new CustomOverlay();
            layer.option = option;
        }
        return layer;
    };

    /**
     * 绑定渲染方法,并将图层绑定到地图
     * @param layer
     * @param callback
     */
    GeneralMap.prototype.bindRender = function (layer,callback) {
        var mapType = this.get('type');
        this.set('element',layer.option);
        var self = this;
        if(mapType == 'baidu'){
            layer.initialize = function (map) {
                //增加缩放事件处理
                map.addEventListener('resize', function(e) {
                    var size = e.size;
                    layer.option.width = size.width;
                    layer.option.height = size.height;
                    layer.draw();
                });

                map.getPanes().mapPane.appendChild(layer.option);
            };
            layer.draw = callback;
            this.map().addOverlay(layer);
        }else if(mapType == 'amap'){
            layer.render = callback;
            layer.setMap(this.map());
        }else if(mapType == 'tmap'){
            layer.update = callback;
            layer.onAdd = function (map) {
                var el = self.get('element');
                map.getPanes().overlayPane.appendChild(el);
            };
            //增加平移事件处理
            this.map().addEventListener("moveend", function (e) {
                layer.update();
            });
            this.map().addOverLay(layer);
        }
    }

    /**
     * 获取边界
     * @returns {{ne: {lng: *, lat: *}, sw: {lng: *, lat: *}}}
     */
    GeneralMap.prototype.getBounds = function () {
        var mapType = this.get('type');
        var map = this.get('map');
        var bounds,ne,sw;
        if(mapType === 'baidu'){
            bounds = map.getBounds();
            ne = bounds.getNorthEast();
            sw = bounds.getSouthWest();
            return {ne:{lng:ne.lng,lat:ne.lat},
                sw:{lng:sw.lng,lat:sw.lat}};
        }else if(mapType === 'amap'){
           bounds = map.getBounds();
           ne = bounds.getNorthEast();
           sw = bounds.getSouthWest();
           return {ne:{lng:ne.getLng(),lat:ne.getLat()},
                    sw:{lng:sw.getLng(),lat:sw.getLat()}};
        }
        else if(mapType === 'tmap'){
            bounds = map.getBounds();
            ne = bounds.getNorthEast();
            sw = bounds.getSouthWest();
            return {ne:{lng:ne.getLng(),lat:ne.getLat()},
                sw:{lng:sw.getLng(),lat:sw.getLat()}};
        }
    };

    /**
     * 地图大小变化、平移时设置图层位置
     */
    GeneralMap.prototype.resize = function () {
        var mapType = this.get('type');
        var map = this.get('map');
        var element = this.get('element');
        if(mapType == 'baidu'){
            var currentBounds = map.getBounds();
            var ne = map.pointToOverlayPixel(currentBounds.getNorthEast()),
                sw = map.pointToOverlayPixel(currentBounds.getSouthWest()),
                topY = ne.y,
                leftX = sw.x,
                h = sw.y - ne.y,
                w = ne.x - sw.x;

            element.style.left = leftX + 'px';
            element.style.top = topY + 'px';
            element.style.width = w + 'px';
            element.style.height = h + 'px';
        }
        else if(mapType == 'amap'){
            //do nothing
        }
        else if(mapType=='tmap'){
            var currentBounds = map.getBounds();

            var ne = map.lngLatToLayerPoint(currentBounds.getNorthEast()),
                sw = map.lngLatToLayerPoint(currentBounds.getSouthWest()),
                topY = ne.y,
                leftX = sw.x,
                h = sw.y - ne.y,
                w = ne.x - sw.x;

            element.style['transform'] = 'translate(' + Math.round(leftX) + 'px,' + Math.round(topY) + 'px)';
            element.style.width = w + 'px';
            element.style.height = h + 'px';
        }
    };

    /**
     * 将经纬度转成坐标
     * @param [lng,lat]
     * @returns {{x, y: *}}
     */
    GeneralMap.prototype.lnglatToPoint = function (lnglat) {
        var mapType = this.get('type');
        var map = this.get('map');
        var point;
        if(mapType === 'baidu'){
            point = map.pointToPixel(new BMap.Point(lnglat[0],lnglat[1]));
            return {x:point.x,y:point.y};
        }else if(mapType === 'amap'){
            point = map.lnglatTocontainer(lnglat)
            return {x:point.getX(),y:point.getY()};
        }
        else if(mapType === 'tmap'){
            point = map.lngLatToContainerPoint(new T.LngLat(lnglat[0],lnglat[1]));
            return {x:point.x,y:point.y};
        }
    };

    /**
     * 获取中心处指定距离的像素数
     * @param center [lng,lat]
     * @param distance 距离
     * @returns {number} 像素
     */
    GeneralMap.prototype.getPixelDistance = function (center,distance) {
        var mapType = this.get('type');
        var map = this.get('map');
        if(mapType === 'baidu'){
            //获取中心点
            var startPoint=new BMap.Point(center[0],center[1]);
            //获取屏幕坐标
            var pixel = map.pointToPixel(startPoint);
            //向右画直线
            pixel.x+=100;
            //转换结束点
            var endPoint = map.pixelToPoint(pixel);
            //计算100像素的距离
            var d = map.getDistance(startPoint,endPoint);
            return distance*100/d;
        }else if(mapType == 'amap'){
            var resolution = map.getResolution(center);
            return distance/resolution;
        }
        else if(mapType == 'tmap'){

        }
    };

    /**
     *
     * @returns {{width, height}}
     */
    GeneralMap.prototype.getSize = function () {
        var mapType = this.get('type');
        var map = this.get('map');
        if(mapType == 'baidu'){
            return map.getSize();
        }else if(mapType == 'amap'){
            var point =  map.getSize();
            return point;
        }
        else if(mapType == 'tmap'){
            var point =  map.getSize();
            return {width:point.x,height:point.y};
        }
    };
    /**
     * map对象
     */
    GeneralMap.prototype.map = function () {
        return this.get('map');
    }
})();