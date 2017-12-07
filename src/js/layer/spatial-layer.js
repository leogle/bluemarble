(function () {
    /**
     * 渲染图层
     * @param option
     * @constructor
     */
    SpatialLayer = function(option) {
       var _ = {
           map: null,
           canvas: {},
           data: null,
           paramName: "",
           unit: "",
           opacity: 0.8,
           palette: {},
           drawArea: { //插值绘制区域（屏幕坐标的左上角为0,0,经纬度左下角为0,0）;默认北京
               "SW": [112.2605669596, 36.0900545859], //西南
               "NE": [120.4252357238, 41.0847299261] //东北
           },
           polygons: []
       };

       this.get = function (key) {
           return _[key];
       };
       this.set = function (key, value) {
           _[key] = value;
       };

       this.prototype = new LayerBase();

       this.configure(option);
       this.initLayer();
   };

    /**
     * 配置图层
     * @param option
     */
    SpatialLayer.prototype.configure = function (option) {
        var self = this;

        var canvas = document.createElement('canvas');
        canvas.width = option.map.getSize().width;
        canvas.height = option.map.getSize().height;
        canvas.style.position = 'absolute';
        option.layerOption = canvas;
        self.set('gradient',option.gradient || {
            0: "rgb(0,200,255)", //蓝色 0
            0.1: "rgb(0,228,0)", //绿色 50
            0.2: "rgb(255,255,0)", //黄色 100
            0.3: "rgb(255,126,0)", //橙色 150
            0.4: "rgb(255,0,0)", //红色 200
            0.6: "rgb(153,0,76)", //紫色 300
            0.8: "rgb(126,0,35)", //褐红 400
            1.0: "rgb(126,0,35)"
        });
        self.set('canvas',canvas);
        self.set("opacity", option.opacity || self.get("opacity") || 0.8);
        self.set("drawArea", option.drawArea || self.get("drawArea") || { "SW": [1, 1], "NE": [2, 2] });
        self.set("canvas", option.canvas || self.get("canvas"));
        self.set("polygons", option.polygons || self.get("polygons") || []);
        self.set('map',option.map);
        self.set('force',option.force || false);
        this.prototype.configMap(this,option.map,option);
    };

    /**
     * 初始化调色板
     */
    SpatialLayer.prototype.initLayer = function () {
        var self = this;
        var _paleCanvas = document.createElement("canvas");
        _paleCanvas.width = "1";
        _paleCanvas.height = "256";
        var ctx = _paleCanvas.getContext("2d");
        var grad = ctx.createLinearGradient(0, 0, 1, 256);
        var gradient = this._getGradientDict();
        for (var x in gradient) {
            grad.addColorStop(parseFloat(x), gradient[x]);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1, 256);
        self.set("palette", ctx.getImageData(0, 0, 1, 256).data);
    };

    /**
     * 渲染函数
     */
    SpatialLayer.prototype.render = function () {
        console.log('render');
        var self = this.tag || this;
        if(self === null)
            return;
        if (!self.get("data")) {
            return;
        }
        //计算需要绘图区域与实际窗口的相交区域，作为最终绘图区域展示给用户
        var _map = self.get("map");
        var _canvas = self.get("canvas");
        var _spatialData = self._setSpatialData(self.get("data"));
        var _paramName = self.get("paramName");
        var _opacity = self.get("opacity");
        var _palette = self.get("palette");
        var _drawArea_GPS = self.get("drawArea");
        var _polygons = self.get("polygons");
        var _force = self.get('force');

        self.prototype.resizeMap();
        var curScreenBounds = _map.getBounds();
        var curScreenArea_GPS = { //注意NE在高德向东跨子午线后为从-180递减
            "SW": [curScreenBounds.sw.lng, curScreenBounds.sw.lat],
            "NE": [curScreenBounds.ne.lng > 0 ? curScreenBounds.ne.lng : 180 + Math.abs(180 + curScreenBounds.ne.lng), curScreenBounds.ne.lat]
        };
        var crossArea_GPS = SpatialLayer._calcCrossRect(_drawArea_GPS, curScreenArea_GPS);
        var context = _canvas.getContext('2d');

        if (crossArea_GPS === null || _spatialData === null) {
            context.clearRect(0, 0, _canvas.width, _canvas.height);
            return;
        }
        crossArea_GPS = SpatialLayer._convetSWNE_to_SENW(crossArea_GPS["SW"], crossArea_GPS["NE"]);
        var crossArea_Pixel = { //最终绘图区域
            "LT": _map.lnglatToPoint([crossArea_GPS["NW"][0], crossArea_GPS["NW"][1]]), //AMap.Pixel，屏幕左上角
            "RB": _map.lnglatToPoint([crossArea_GPS["SE"][0], crossArea_GPS["SE"][1]])
        };
        console.log(crossArea_Pixel);

        //清空旧地图
        var width = _canvas.width,
            height = _canvas.height;
        context.clearRect(0, 0, _canvas.width, _canvas.height);

        //屏幕内插值绘图区域
        var height_start = parseInt(crossArea_Pixel["LT"].y.toFixed(0));
        var height_end = parseInt(crossArea_Pixel["RB"].y.toFixed(0));
        var width_start = parseInt(crossArea_Pixel["LT"].x.toFixed(0));
        var width_end = parseInt(crossArea_Pixel["RB"].x.toFixed(0));

        var display_width = width_end - width_start;
        var display_height = height_end - height_start;
        console.log(width_start);
        //根据计算量选择何种插值方式(200*150*300点)
        if (display_height * display_width * _spatialData.length > 900000 && !_force) {
            //采用马赛克绘图,计算马赛克比例
            var lagerside = display_width > display_height ? display_width : display_height;
            var calccount = 900000 / _spatialData.length; //网格最大计算数量
            var ratio = Math.ceil(Math.pow(lagerside * lagerside / calccount, 0.5));
            ratio = ratio > 1 ? ratio : 1;
            var rect_w = ratio;
            var rect_h = ratio;

            self._interpolateRect(_spatialData, _paramName, context, _opacity, _palette, width, height, width_start, width_end, height_start, height_end, rect_w, rect_h, _polygons);

            //在6000计算量时，双线性插值1800*900需要4s
            // let image = context.createImageData(width, height);
            // let imageColored =interpolateRectAndDL(_spatialData,_paramName,image,0.9,_palette,width,height,width_start,width_end,height_start,height_end,rect_w,rect_h)
            // context.putImageData(imageColored, 0, 0);
        } else {
            //采用逐像素画图
            var image = context.createImageData(_canvas.width, _canvas.height);
            //更新图片数据
            var imageColored = self._interpolate(_spatialData, _paramName, image, _opacity, _palette, width, height, width_start, width_end, height_start, height_end, _polygons);
            context.putImageData(imageColored, 0, 0);
        }
    };

    //-------------------空间差值着色算法-------------------------------------------------------
    SpatialLayer.prototype._interpolate = function (_spatialData, _paramName, image, alpha, _palette, width, height, x1, x2, y1, y2, polygons) {
        //插值
        //按照画布逐像素点着色
        var imgData = image.data;
        var d = _spatialData;
        var dlen = d.length;
        var map = this.get("map");
        //得到点值的二维数组
        var matrixData = [];
        for (var i = 0; i <= height; i++) {
            matrixData[i] = [];
            for (var j = 0; j <= width; j++) {
                matrixData[i][j] = '';
            }
        }
        for (var _i = 0; _i < dlen; _i++) {
            var point = d[_i];
            if (x1 <= point.x && point.x <= x2 && y1 <= point.y && point.y <= y2) {
                //仅在需要画图的区域初始化监测点数据
                matrixData[point.y][point.x] = point.value;
            }
        }

        /**
         * 插值矩阵数据,时间复杂度O(height*width*len)
         * 当height = 356, width = 673, len = 26时为6229288
         */
        for (var _i2 = y1; _i2 <= y2; _i2++) {
            for (var _j = x1; _j <= x2; _j++) {
                if (matrixData[_i2][_j] === '') {

                    //根据行政区边界裁剪
                    // if(polygons.length>0){
                    // 	let pointlnglat=map.containerToLngLat(new AMap.Pixel(j,i));
                    // 	let iscontain=false;
                    // 	for(let p of polygons){
                    // 		if(p.contains(pointlnglat)){
                    // 			iscontain=true;
                    // 			break;
                    // 		}
                    // 	}
                    // 	if(!iscontain){
                    // 		continue;
                    // 	}
                    // }

                    var sum0 = 0,
                        sum1 = 0;
                    for (var k = 0; k < dlen; k++) {

                        //将点位影响范围限制在500米内，性能下降不可接受
                        // let pointlnglat=map.containerToLngLat(new AMap.Pixel(j,i));
                        // if(pointlnglat.distance(new AMap.LngLat(d[k].lng,d[k].lat))>500){
                        // 	continue;
                        // }
                        var distance = (_i2 - d[k].y) * (_i2 - d[k].y) + (_j - d[k].x) * (_j - d[k].x);
                        //distance=Math.pow((i-d[k].y)*(i-d[k].y) + (j-d[k].x)*(j-d[k].x),-2);

                        sum0 += d[k].value * 1.0 / distance;
                        sum1 += 1.0 / distance;

                        // sum0 += d[k].value*1.0/((i-d[k].y)*(i-d[k].y) + (j-d[k].x)*(j-d[k].x));
                        // sum1 += 1.0/((i-d[k].y)*(i-d[k].y) + (j-d[k].x)*(j-d[k].x));
                    }
                    if (sum1 != 0) matrixData[_i2][_j] = sum0 / sum1; else matrixData[_i2][_j] = 0;
                }
            }
        }
        //更新图片数据
        for (var _i3 = y1; _i3 <= y2; _i3++) {
            for (var _j2 = x1; _j2 <= x2; _j2++) {
                if (matrixData[_i3][_j2] == "") {
                    continue;
                }
                var radio = SpatialLayer._getRadioByValue(_paramName, matrixData[_i3][_j2]);
                //radio=0.8

                // imgData[4*(i*width+j)] = 0;
                // imgData[4*(i*width+j) + 1] = 255;
                // imgData[4*(i*width+j) + 2] = 0;
                // imgData[4*(i*width+j) + 3] = Math.floor(255*0.5);

                imgData[4 * (_i3 * width + _j2)] = _palette[Math.floor(radio * 255 + 1) * 4 - 4];
                imgData[4 * (_i3 * width + _j2) + 1] = _palette[Math.floor(radio * 255 + 1) * 4 - 3];
                imgData[4 * (_i3 * width + _j2) + 2] = _palette[Math.floor(radio * 255 + 1) * 4 - 2];
                imgData[4 * (_i3 * width + _j2) + 3] = Math.floor(255 * alpha);
            }
        }
        //image.data = imgData;
        return image;
    };

    SpatialLayer.prototype._interpolateRect = function (_spatialData, _paramName, context, alpha, _palette, width, height, x1, x2, y1, y2, rect_w, rect_h, polygons) {
        //将画布按照矩形马赛克做插值,按照矩阵格点的中心值做着色

        var d = _spatialData;
        var dlen = d.length;
        var map = this.get("map");
        //得到点值的二维数组，针对画布每个矩阵颜色
        var matrixData = [];
        var rect_x_count = Math.ceil((x2 - x1) / rect_w); //矩形x坐标上数量
        var rect_y_count = Math.ceil((y2 - y1) / rect_h); //矩形y坐标上数量
        var rect_x1 = x1,
            rect_y1 = y1; //第一个矩形绘制时起始像素位置
        if (Math.floor(rect_w / 2) > 0 && Math.floor(rect_h / 2) > 0) {
            rect_x1 += Math.floor(rect_w / 2);
            rect_y1 += Math.floor(rect_h / 2);
        }

        for (var i = 0; i <= rect_y_count; i++) {
            matrixData[i] = [];
            for (var j = 0; j <= rect_x_count; j++) {
                matrixData[i][j] = '';
            }
        }
        //使用监测点数据初始化矩阵
        // for(let i = 0; i < dlen; i++) {
        // 	let point  = d[i];
        // 	if(x1<=point.x && point.x<=x2 && y1<=point.y && point.y<=y2){
        // 		//仅在需要画图的区域初始化监测点数据
        // 		let px=Math.ceil((point.x-x1)/rect_w);
        // 		let py=Math.ceil((point.y-y1)/rect_h);
        // 		if(px<rect_x_count && py<rect_y_count&&(matrixData[py][px]==""||matrixData[py][px]<point.value)){
        // 			matrixData[py][px] = point.value;
        // 		}
        // 	}
        // }

        /**
         * 插值矩阵数据,时间复杂度O(height*width*len)
         * 当height = 356, width = 673, len = 26时为6229288
         */
        for (var _i4 = 0; _i4 <= rect_y_count; _i4++) {
            for (var _j3 = 0; _j3 <= rect_x_count; _j3++) {
                if (matrixData[_i4][_j3] == '') {
                    //根据行政区边界裁剪
                    // if(polygons.length>0){
                    // 	let pointlnglat=map.containerToLngLat(new AMap.Pixel(rect_x1+j*rect_w,rect_y1+i*rect_h));
                    // 	let iscontain=false;
                    // 	for(let p of polygons){
                    // 		if(p.contains(pointlnglat)){
                    // 			iscontain=true;
                    // 			break;
                    // 		}
                    // 	}
                    // 	if(!iscontain){
                    // 		continue;
                    // 	}
                    // }


                    var sum0 = 0,
                        sum1 = 0;
                    var px = rect_x1 + _j3 * rect_w;
                    var py = rect_y1 + _i4 * rect_w;
                    for (var k = 0; k < dlen; k++) {
                        var distance = (py - d[k].y) * (py - d[k].y) + (px - d[k].x) * (px - d[k].x);

                        sum0 += d[k].value * 1.0 / distance;
                        sum1 += 1.0 / distance;

                        // sum0 += d[k].value*1.0/((i-d[k].y)*(i-d[k].y) + (j-d[k].x)*(j-d[k].x));
                        // sum1 += 1.0/((i-d[k].y)*(i-d[k].y) + (j-d[k].x)*(j-d[k].x));
                    }
                    if (sum1 != 0) matrixData[_i4][_j3] = sum0 / sum1; else matrixData[_i4][_j3] = 0;
                }
            }
        }
        //绘制矩形
        for (var _i5 = 0; _i5 <= rect_y_count; _i5++) {
            for (var _j4 = 0; _j4 <= rect_x_count; _j4++) {
                if (matrixData[_i5][_j4] == "") {
                    continue;
                }

                var radio = SpatialLayer._getRadioByValue(_paramName, matrixData[_i5][_j4]);

                var r = _palette[Math.floor(radio * 255 + 1) * 4 - 4];
                var g = _palette[Math.floor(radio * 255 + 1) * 4 - 3];
                var b = _palette[Math.floor(radio * 255 + 1) * 4 - 2];
                var colortext = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
                context.fillStyle = colortext;
                context.fillRect(rect_x1 + _j4 * rect_w, rect_y1 + _i5 * rect_h, rect_w, rect_h);
            }
        }
    };

    SpatialLayer._getRadioByValue = function (param, value) {
        //根据污染物名称和浓度值计算在图例中显示的颜色比例
        var levelDict = SpatialLayer._getParamValueLevelDict(param);
        if (value < 0) {
            return 0.0;
        } else {
            for (var key in levelDict) {
                if (levelDict[key][1] == null && value > levelDict[key][0]) {
                    //最大值
                    return key;
                } else if (levelDict[key][0] < value && value <= levelDict[key][1]) {
                    return parseFloat(key) + (value - levelDict[key][0]) / (levelDict[key][1] - levelDict[key][0]) * levelDict[key][2];
                }
            }
        }
    };

    SpatialLayer._getParamValueLevelDict = function (param) {
        //根据污染物名称获取分级比例字典

        //格式[起始浓度,终止浓度,下一等级与当前等级的比例差] ,0.6的起始和终止值一样为了在iaqi>300后快速过度到0.8颜色
        if (param == "PM10") {
            return { 0: [0, 50, 0.1], 0.1: [50, 150, 0.1], 0.2: [150, 250, 0.1], 0.3: [250, 350, 0.1], 0.4: [350, 420, 0.2], 0.6: [420, 420, null], 0.8: [420, null, null] }; //更高的值颜色不变
        } else if (param == "PM2_5") {
            return { 0: [0, 35, 0.1], 0.1: [35, 75, 0.1], 0.2: [75, 115, 0.1], 0.3: [115, 150, 0.1], 0.4: [150, 250, 0.2], 0.6: [250, 250, null], 0.8: [250, null, null] }; //更高的值颜色不变
        } else if (param == "SO2") {
            return { 0: [0, 150, 0.1], 0.1: [150, 500, 0.1], 0.2: [500, 650, 0.1], 0.3: [650, 800, 0.1], 0.4: [800, 1600, 0.2], 0.6: [1600, 1600, null], 0.86: [1600, null, null] }; //更高的值颜色不变
        } else if (param == "NO2") {
            return { 0: [0, 100, 0.1], 0.1: [100, 200, 0.1], 0.2: [200, 700, 0.1], 0.3: [700, 1200, 0.1], 0.4: [1200, 2340, 0.2], 0.6: [2340, 2340, null], 0.8: [2340, null, null] }; //更高的值颜色不变
        } else if (param == "CO") {
            return { 0: [0, 5, 0.1], 0.1: [5, 10, 0.1], 0.2: [10, 35, 0.1], 0.3: [35, 60, 0.1], 0.4: [60, 90, 0.2], 0.6: [90, 90, null], 0.8: [90, null, null] }; //更高的值颜色不变
        } else if (param == "O3") {
            return { 0: [0, 160, 0.1], 0.1: [160, 200, 0.1], 0.2: [200, 300, 0.1], 0.3: [300, 400, 0.1], 0.4: [400, 800, 0.2], 0.6: [800, 800, null], 0.8: [800, null, null] }; //更高的值颜色不变
        }
    };
    SpatialLayer.prototype._setSpatialData = function (data) {
        //data:{datas:[{"lat": 40.2929, "value": 21.0, "lng": 116.2266}, {"lat": 39.9301, "value": 16.0, "lng": 116.4233}...]
        //,paramName:"PM10",unit:"ug/m3"}
        if (data === null) {
            return null;
        }
        var _map = this.get("map");
        var _jsonData = data.datas;
        var _jdlen = data.datas.length;
        var _spatialData = [];
        while (_jdlen--) {
            var pixel = _map.lnglatToPoint([_jsonData[_jdlen].lng, _jsonData[_jdlen].lat]);
            _spatialData.push({
                "lng": _jsonData[_jdlen].lng,
                "lat": _jsonData[_jdlen].lat,
                "x": parseInt(pixel.x),
                "y": parseInt(pixel.y),
                "value": _jsonData[_jdlen].value
            });
        }
        this.set("paramName", data.paramName);
        this.set("unit", data.unit);
        return _spatialData;
    };
    SpatialLayer.prototype.update = function (data) {
        this.set("data", data);
        if (data.datas[0].header) {
            //包含区域，则重新设置插值区域
            this.set("drawArea", { "SW": [data.datas[0].header.lo1, data.datas[0].header.la1], "NE": [data.datas[0].header.lo2, data.datas[0].header.la2] });
        }
        if (this.get("polygons").length > 0) {
            //包含裁剪区域
            this.set("data", this._convertRegionData(data, this.get("polygons")));
        }
        this.render();
    };
    SpatialLayer._calcCrossRect = function (draw_rect, scree_rect) {
        //计算相交矩形区域，传入矩形都是SW，NE格式
        var nMaxLeft = 0;
        var nMaxTop = 0;
        var nMinRight = 0;
        var nMinBottom = 0;

        //计算两矩形可能的相交矩形的边界
        nMaxLeft = draw_rect["SW"][0] >= scree_rect["SW"][0] ? draw_rect["SW"][0] : scree_rect["SW"][0];
        nMinBottom = draw_rect["SW"][1] >= scree_rect["SW"][1] ? draw_rect["SW"][1] : scree_rect["SW"][1];
        nMinRight = draw_rect["NE"][0] <= scree_rect["NE"][0] ? draw_rect["NE"][0] : scree_rect["NE"][0];
        nMaxTop = draw_rect["NE"][1] <= scree_rect["NE"][1] ? draw_rect["NE"][1] : scree_rect["NE"][1];

        // 判断是否相交
        if (nMaxLeft > nMinRight || nMinBottom > nMaxTop) {
            //不相交
            return null;
        } else {
            //返回相交矩形，格式SW，NE
            return {
                "SW": [nMaxLeft, nMinBottom],
                "NE": [nMinRight, nMaxTop]
            };
        }
    };
    SpatialLayer._convetSWNE_to_SENW = function (sw, ne) {
        //用于将GPS转换为屏幕坐标：将西南、东北坐标转换为东南、西北
        return {
            "SE": [ne[0], sw[1]],
            "NW": [sw[0], ne[1]]
        };
    };
    SpatialLayer.prototype._getGradientDict = function () {
        //AQI颜色标记字典(依据IAQI比例分级)
        return this.get('gradient');
    };
})();