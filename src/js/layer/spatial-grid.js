(function (module, exports) {


    function SpatialGrids(map, amapCustomLayer, option) {
        var _ = {
            map: map,
            amapLayer: amapCustomLayer,
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
        this.configure(option);
        this.initLayer();
    }

    SpatialGrids.prototype.configure = function (option) {
        var self = this;
        self.set("opacity", option.opacity || self.get("opacity") || 0.8);
        self.set("drawArea", option.drawArea || self.get("drawArea") || { "SW": [1, 1], "NE": [2, 2] });
        self.set("canvas", option.canvas || self.get("canvas"));
        // self.set("data",option.data || self.get("data"));
        self.set("polygons", option.polygons || self.get("polygons") || []);
    };
    SpatialGrids.prototype.initLayer = function () {
        var self = this;
        var _paleCanvas = document.createElement("canvas");
        _paleCanvas.width = "1";
        _paleCanvas.height = "256";
        var ctx = _paleCanvas.getContext("2d");
        var grad = ctx.createLinearGradient(0, 0, 1, 256);
        var gradient = SpatialGrids._getGradientDict();
        for (var x in gradient) {
            grad.addColorStop(x, gradient[x]);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1, 256);
        this.set("palette", ctx.getImageData(0, 0, 1, 256).data);

        this.get("amapLayer").render = function () {

            if (!self.get("data")) {
                return;
            }
            //计算需要绘图区域与实际窗口的相交区域，作为最终绘图区域展示给用户
            var _map = self.get("map");
            var _canvas = self.get("canvas");
            var header = self.get("data").datas[0].header;
            var grids = self._setGridData(self.get("data"));
            var _paramName = self.get("paramName");
            var _opacity = self.get("opacity");
            var _palette = self.get("palette");
            var _drawArea_GPS = self.get("drawArea");
            var _polygons = self.get("polygons");

            var curScreenBounds = _map.getBounds();
            var curScreenArea_GPS = { //注意NE在高德向东跨子午线后为从-180递减
                "SW": [curScreenBounds.getSouthWest().getLng(), curScreenBounds.getSouthWest().getLat()],
                "NE": [curScreenBounds.getNorthEast().getLng() > 0 ? curScreenBounds.getNorthEast().getLng() : 180 + Math.abs(180 + curScreenBounds.getNorthEast().getLng()), curScreenBounds.getNorthEast().getLat()]
            };
            var crossArea_GPS = SpatialGrids._calcCrossRect(_drawArea_GPS, curScreenArea_GPS);
            var context = _canvas.getContext('2d');

            if (crossArea_GPS == null || grids == null) {
                context.clearRect(0, 0, _canvas.width, _canvas.height);
                return;
            }
            crossArea_GPS = SpatialGrids._convetSWNE_to_SENW(crossArea_GPS["SW"], crossArea_GPS["NE"]);
            var crossArea_Pixel = { //最终绘图区域
                "LT": _map.lngLatToContainer(new AMap.LngLat(crossArea_GPS["NW"][0], crossArea_GPS["NW"][1])), //AMap.Pixel，屏幕左上角
                "RB": _map.lngLatToContainer(new AMap.LngLat(crossArea_GPS["SE"][0], crossArea_GPS["SE"][1]))
            };

            //清空旧地图
            var width = _canvas.width,
                height = _canvas.height;
            context.clearRect(0, 0, _canvas.width, _canvas.height);

            //屏幕内插值绘图区域
            var height_start = parseInt(crossArea_Pixel["LT"].getY().toFixed(0));
            var height_end = parseInt(crossArea_Pixel["RB"].getY().toFixed(0));
            var width_start = parseInt(crossArea_Pixel["LT"].getX().toFixed(0));
            var width_end = parseInt(crossArea_Pixel["RB"].getX().toFixed(0));

            var rect_w = 1; //计算宽增长步长
            var rect_h = 1; //计算高增长步长
            var display_width = width_end - width_start;
            var display_height = height_end - height_start;
            if (display_height * display_width > 1366 * 168) {
                rect_w = rect_h = 3;
            } else if (display_height * display_width > 800 * 600) {
                rect_w = rect_h = 2;
            }

            var image = context.createImageData(width, height);
            var imageColored = self._interpolateRectAndDL(_map, grids, _paramName, image, 0.9, _palette, header.lo1, header.la1, header.dx, header.dy, header.nx, header.ny, width, height, width_start, width_end, height_start, height_end, rect_w, rect_h);
            context.putImageData(imageColored, 0, 0);
        };
    };
    SpatialGrids.prototype.update = function (data) {
        this.set("data", data);
        if (data.datas[0].header) {
            //包含区域，则重新设置插值区域
            this.set("drawArea", { "SW": [data.datas[0].header.lo1, data.datas[0].header.la1], "NE": [data.datas[0].header.lo2, data.datas[0].header.la2] });
        }
        if (this.get("polygons").length > 0) {
            //包含裁剪区域
            this.set("data", this._convertRegionData(data, this.get("polygons")));
        }
        this.get("amapLayer").render();
    };

    SpatialGrids.prototype.dispose = function (data) {
        this.set("map", null);
        this.set("amapLayer", null);
        this.set("canvas", null);
        this.set("palette", null);
        var polygons = this.get("polygons");
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = polygons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done) ; _iteratorNormalCompletion = true) {
                var polygon = _step.value;

                polygon.setMap(null);
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        this.set("polygons", []);
        this.set("data", null);
        this.set("grids", null);
        this.set("paramName", null);
        this.set("unit", null);
    };

    SpatialGrids.prototype._interpolateRectAndDL = function (map, grids, _paramName, image, alpha, _palette, lo1, la1, dlo, dla, nx, ny, width, height, x1, x2, y1, y2, rect_w, rect_h) {
        //将画布按照矩形马赛克插值后再做双线性插值,矩阵记录左上角数值

        var imgData = image.data;

        var lnglat00 = map.containerToLngLat(new AMap.Pixel(x1, y2)); //拿到最左下角的经纬度
        var xi = (lnglat00.getLng() - lo1) / dlo;
        var yj = (lnglat00.getLat() - la1) / dla;
        var xi_offset = Math.floor(xi >= 0 ? xi : 0); //相对于左下角的整体偏移
        var yj_offset = Math.floor(yj >= 0 ? yj : 0); //相对于左下角的整体偏移

        if (xi_offset < 0 || xi_offset + 1 >= nx || yj_offset < 0 || yj_offset + 1 >= ny) return image;

        var colorDict = SpatialGrids._getColorLevelDict();
        var x_maps = null; //存储当前插值时x与经纬度关系，提高性能
        //双线性插值更新图片数据
        for (var i = y2; i >= y1; i -= rect_h) {

            while (yj_offset + 1 < ny) {
                if (i > grids[yj_offset + 1][xi_offset].y) {
                    break;
                } else {
                    yj_offset++;
                }
            }
            if (yj_offset + 1 >= ny || i < grids[yj_offset + 1][xi_offset].y) {
                break;
            }

            //初始化x_maps
            if (!x_maps) {
                x_maps = [];
                var x_offset = xi_offset;
                for (var j1 = x1; j1 <= x2; j1 += rect_w) {
                    while (x_offset + 1 < nx) {
                        if (j1 < grids[yj_offset][x_offset + 1].x) {
                            break;
                        } else {
                            x_offset++;
                        }
                    }
                    if (x_offset + 1 >= nx || j1 > grids[yj_offset][x_offset + 1].x) {
                        break;
                    }
                    x_maps[j1] = x_offset;
                }
            }
            for (var j = x1; j <= x2; j += rect_w) {

                var x_index = x_maps[j];
                if (!SpatialGrids._isValue(x_index) || x_index + 1 >= nx || j > grids[yj_offset][x_index + 1].x) {
                    break;
                }

                var g = this._getInterpolateGrid2(grids, x_index, yj_offset);
                if (!g) {
                    continue;
                }
                var innerx = j - g.g01.x;
                var innery = i - g.g01.y;
                //网格长宽
                var dx = g.g10.x - g.g00.x;
                var dy = g.g00.y - g.g01.y;

                var q11 = g.g01.value;
                var q21 = g.g11.value;
                var q12 = g.g00.value;
                var q22 = g.g10.value;

                var pvalue = 0;

                if (dx == 0 || dy == 0) {
                    pvalue = g.g01.value; //当地图缩放很小的时候，直接赋值
                } else {
                    var p1value = q11 * (dx - innerx) / dx + q21 * innerx / dx;
                    var p2value = q12 * (dx - innerx) / dx + q22 * innerx / dx;
                    pvalue = p1value * (dy - innery) / dy + p2value * innery / dy;
                }

                var radio = SpatialGrids._getRadioByValue(_paramName, pvalue);
                var colorIndex = SpatialGrids._calcParamColorLevel(_paramName, pvalue);
                var color = colorDict[colorIndex];

                for (var h = 0; h < rect_h; h++) {
                    for (var w = 0; w < rect_w; w++) {
                        if (j + w + 3 > width) {
                            //防止右侧超出窗口后，左侧出现额外颜色
                            continue;
                        }
                        //渐变形式
                        imgData[4 * ((i + h) * width + j + w)] = _palette[Math.floor(radio * 255 + 1) * 4 - 4];
                        imgData[4 * ((i + h) * width + j + w) + 1] = _palette[Math.floor(radio * 255 + 1) * 4 - 3];
                        imgData[4 * ((i + h) * width + j + w) + 2] = _palette[Math.floor(radio * 255 + 1) * 4 - 2];
                        imgData[4 * ((i + h) * width + j + w) + 3] = Math.floor(255 * alpha);

                        //等值面形式
                        // imgData[4*((i+h)*width+j+w)] = color.r;
                        // imgData[4*((i+h)*width+j+w) + 1] = color.g;
                        // imgData[4*((i+h)*width+j+w) + 2] = color.b;
                        // imgData[4*((i+h)*width+j+w) + 3] = Math.floor(255*alpha);
                    }
                }
                // imgData[4*(i*width+j)] = _palette[Math.floor(radio*255+1)*4-4];
                // imgData[4*(i*width+j) + 1] = _palette[Math.floor(radio*255+1)*4-3];
                // imgData[4*(i*width+j) + 2] = _palette[Math.floor(radio*255+1)*4-2];
                // imgData[4*(i*width+j) + 3] = Math.floor(255*alpha);
            }
        }
        return image;
    };

    //将一维数据转换为二维数组，并计算屏幕坐标
    SpatialGrids.prototype._setGridData = function (data) {
        //data:{datas:[{header:{},data:[]}],paramName:"PM10",unit:"ug/m3"}
        if (data == null) {
            return null;
        }
        var _map = this.get("map");

        var values = data.datas[0].data;
        var header = data.datas[0].header;

        var λ0 = header.lo1,
            φ0 = header.la1;
        var Δλ = header.dx,
            Δφ = header.dy;
        var ni = header.nx,
            nj = header.ny;

        var grids = [],
            p = 0;
        var isContinuous = Math.floor(ni * Δλ) >= 360;
        for (var j = 0; j < nj; j++) {
            var row = [];
            for (var i = 0; i < ni; i++, p++) {
                var lon = λ0 + i * Δλ;
                var lat = φ0 + j * Δφ;
                var pixel = _map.lngLatToContainer(new AMap.LngLat(lon, lat));
                row[i] = {
                    "lng": lon,
                    "lat": lat,
                    "x": parseInt(pixel.getX()),
                    "y": parseInt(pixel.getY()),
                    "value": values[p]
                };
            }
            if (isContinuous) {
                row.push(row[0]);
            }
            grids[j] = row;
        }
        //grids是列索引从南0-北180，行索引从西0-东361，对应的GFS的经纬度格式
        this.set("grids", grids);
        this.set("paramName", data.paramName);
        this.set("unit", data.unit);
        return grids;
        //[
        //[{x:,y:,lng:,lat:,value},{x:,y:,lng:,lat:,value}],
        //[{x:,y:,lng:,lat:,value},{x:,y:,lng:,lat:,value}],
        //]
    };

    //将外部原始数据根据裁剪区域计算过滤剩下需要显示的区域
    //不在显示区域内的格点数据为null
    SpatialGrids.prototype._convertRegionData = function (data, polygons) {
        //data:{datas:[{"lat": 40.2929, "value": 21.0, "lng": 116.2266}, {"lat": 39.9301, "value": 16.0, "lng": 116.4233}...]
        //,paramName:"PM10",unit:"ug/m3"}
        if (data === null) {
            return null;
        }
        //当区域大于3个时，不再裁剪（效率原因）
        if (polygons.length > 15) {
            return data;
        }

        var values = data.datas[0].data;
        var header = data.datas[0].header;

        var λ0 = header.lo1,
            φ0 = header.la1;
        var Δλ = header.dx,
            Δφ = header.dy;
        var ni = header.nx,
            nj = header.ny;
        var p = 0;

        for (var v = 0; v < values.length; v++) {
            values[v] = {
                actived: false,
                value: values[v]
            };
        }

        for (var j = 0; j < nj; j++) {
            for (var i = 0; i < ni; i++, p++) {

                var lon = λ0 + i * Δλ;
                var lat = φ0 + j * Δφ;

                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = polygons[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) ; _iteratorNormalCompletion2 = true) {
                        var polygon = _step2.value;

                        if (polygon.contains([lon, lat])) {
                            //自身在范围内，则激活上下左右8个点
                            values[p].actived = true;
                            if (values[p - 1]) values[p - 1].actived = true; //左
                            if (values[p + 1]) values[p + 1].actived = true; //右
                            if (values[p + ni]) values[p + ni].actived = true; //上
                            if (values[p - ni]) values[p - ni].actived = true; //下
                            if (values[p + ni - 1]) values[p + ni - 1].actived = true; //左上
                            if (values[p + ni + 1]) values[p + ni + 1].actived = true; //右上
                            if (values[p - ni - 1]) values[p - ni - 1].actived = true; //左下
                            if (values[p - ni + 1]) values[p - ni + 1].actived = true; //右下
                            break;
                        } else {
                            // //如果自身不在范围内
                            // if(polygon.contains([lon+Δλ, lat+Δφ]) || polygon.contains([lon-Δλ, lat-Δφ]))
                            // {//但斜四角有一个点在范围内，则保留，为了让插值图比边界大一圈
                            // 	continue;
                            // }
                            // else{
                            // 	values[p].actived=null;
                            // }
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
        }

        for (var _v = 0; _v < values.length; _v++) {
            values[_v] = values[_v].actived ? values[_v].value : null;
        }

        return data;
    };

    /**
     * 根据偏移计算，速度快效果好
     * 获取指定xy要插值时左下g00，左上g01，右下g10，右上g11的值
     * @param  {[type]} grids    完整grids数据
     * @param  {[type]} x_offset 包含网格的左下角索引
     * @param  {[type]} y_offset 包含网格的左下角索引
     * @return {[type]}          [description]
     *
     * g01              g11
     *
     *
     *      (x,y)
     *
     * g00              g10
     */
    SpatialGrids.prototype._getInterpolateGrid2 = function (grids, x_offset, y_offset) {
        var fi = x_offset,
            ci = fi + 1;
        var fj = y_offset,
            cj = fj + 1;

        var row;
        if (row = grids[fj]) {
            var g00 = row[fi];
            var g10 = row[ci];
            if (SpatialGrids._isValue(g00) && SpatialGrids._isValue(g10) && (row = grids[cj])) {
                var g01 = row[fi];
                var g11 = row[ci];
                if (SpatialGrids._isValue(g01) && SpatialGrids._isValue(g11)) {
                    if (g00.value != null && g01.value != null && g10.value != null && g11.value != null) {
                        return {
                            g00: g00,
                            g10: g10,
                            g01: g01,
                            g11: g11
                        };
                    }
                }
            }
        }
        return null;
    };

    //---------------------工具方法------------------------------

    SpatialGrids._calcGridMap = function (grids, width, height, x1, x2, y1, y2, rect_w, rect_h, xi_offset, yj_offset, nx, ny) {
        var map = [];
        var lngIndex = xi_offset;
        var latIndex = yj_offset;

        for (var j = y1; j < y2; j++) {
            if (latIndex + 1 < ny && grids[latIndex + 1][lngIndex].y <= j) {
                latIndex++;
            }
            for (var i = x1; i < x2; i++) {
                if (lngIndex + 1 < ny && grids[latIndex][lngIndex + 1].x <= i) {
                    lngIndex++;
                }
                map[j][i] = grids[latIndex][lngIndex];
            }
        }
    };

    SpatialGrids._isValue = function (x) {
        return x !== null && x !== undefined;
    };
    //
    SpatialGrids._calcCrossRect = function (draw_rect, scree_rect) {
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
    SpatialGrids._convetSWNE_to_SENW = function (sw, ne) {
        //用于将GPS转换为屏幕坐标：将西南、东北坐标转换为东南、西北
        return {
            "SE": [ne[0], sw[1]],
            "NW": [sw[0], ne[1]]
        };
    };
    SpatialGrids._convetSENW_to_SWNE = function (se, nw) {
        //用于将屏幕坐标转换为GPS：将东南、西北坐标转换为西南、东北
        return {
            "SW": [nw[0], se[1]],
            "NE": [se[0], nw[1]]
        };
    };

    SpatialGrids._getRadioByValue = function (param, value) {
        //根据污染物名称和浓度值计算在图例中显示的颜色比例
        var levelDict = SpatialGrids._getParamValueLevelDict(param);
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
    SpatialGrids._rgbToHex = function (r, g, b) {
        //将rgb转换为color的hex字符
        //rgbToHex(0, 51, 255) >>> #0033ff
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    SpatialGrids._getParamValueLevelDict = function (param) {
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
    SpatialGrids._getGradientDict = function () {
        //AQI颜色标记字典(依据IAQI比例分级)
        return {
            0: "rgb(0,200,255)", //蓝色 0
            0.1: "rgb(0,228,0)", //绿色 50
            0.2: "rgb(255,255,0)", //黄色 100
            0.3: "rgb(255,126,0)", //橙色 150
            0.4: "rgb(255,0,0)", //红色 200   //当正好渲染此颜色时图片上有麻点，不知道原因未解决
            0.6: "rgb(153,0,76)", //紫色 300
            0.8: "rgb(126,0,35)", //褐红 400
            1.0: "rgb(126,0,35)"
        };
    };

    SpatialGrids._calcParamColorLevel = function (param, value) {
        if (value < 0) {
            return 1;
        }
        //根据污染物名称获取分级比例字典(value向低一级颜色靠)
        var vdict = null;
        //格式   {起始index:[起始浓度,终止浓度,分级份数]
        if (param == "PM10") {
            vdict = { 1: [0, 50, 6], 7: [50, 150, 6], 13: [150, 250, 6], 19: [250, 350, 6], 25: [350, 420, 6], 31: [420, 420, 6], 37: [420, null, null] }; //更高的值颜色不变
        } else if (param == "PM2_5") {
            vdict = { 1: [0, 35, 6], 7: [35, 75, 6], 13: [75, 115, 6], 19: [115, 150, 6], 25: [150, 250, 6], 31: [250, 250, 6], 37: [250, null, null] }; //更高的值颜色不变
        } else if (param == "SO2") {
            vdict = { 1: [0, 150, 6], 7: [150, 500, 6], 13: [500, 650, 6], 19: [650, 800, 6], 25: [800, 1600, 6], 31: [1600, 1600, 6], 37: [1600, null, null] }; //更高的值颜色不变
        } else if (param == "NO2") {
            vdict = { 1: [0, 100, 6], 7: [100, 200, 6], 13: [200, 700, 6], 19: [700, 1200, 6], 25: [1200, 2340, 6], 31: [2340, 2340, 6], 37: [2340, null, null] }; //更高的值颜色不变
        } else if (param == "CO") {
            vdict = { 1: [0, 5, 6], 7: [5, 10, 6], 13: [10, 35, 6], 19: [35, 60, 6], 25: [60, 90, 6], 31: [90, 90, 6], 37: [90, null, null] }; //更高的值颜色不变
        } else if (param == "O3") {
            vdict = { 1: [0, 160, 6], 7: [160, 200, 6], 13: [200, 300, 6], 19: [300, 400, 6], 25: [400, 800, 6], 31: [800, 800, 6], 37: [800, null, null] }; //更高的值颜色不变
        }

        for (var key in vdict) {
            if (vdict[key][1] == null && value > vdict[key][0]) {
                //最大值
                return parseInt(key);
            } else if (vdict[key][0] < value && value <= vdict[key][1]) {
                var num = Math.floor((value - vdict[key][0]) / ((vdict[key][1] - vdict[key][0]) / vdict[key][2]));
                return parseInt(key) + num;
            }
        }
    };

    SpatialGrids._getColorLevelDict = function () {
        //AQI颜色标记字典(依据IAQI比例分级)
        return {
            1: { r: 51, g: 204, b: 255 }, //蓝色 0
            2: { r: 60, g: 213, b: 213 },
            3: { r: 68, g: 221, b: 170 },
            4: { r: 77, g: 230, b: 128 },
            5: { r: 85, g: 238, b: 85 },
            6: { r: 94, g: 247, b: 43 },
            7: { r: 102, g: 255, b: 0 }, //绿色 50
            8: { r: 128, g: 255, b: 0 },
            9: { r: 153, g: 255, b: 0 },
            10: { r: 179, g: 255, b: 0 },
            11: { r: 204, g: 255, b: 0 },
            12: { r: 230, g: 255, b: 0 },
            13: { r: 255, g: 255, b: 0 }, //黄色 100
            14: { r: 255, g: 238, b: 0 },
            15: { r: 255, g: 221, b: 0 },
            16: { r: 255, g: 204, b: 0 },
            17: { r: 255, g: 187, b: 0 },
            18: { r: 255, g: 170, b: 0 },
            19: { r: 255, g: 153, b: 0 }, //橙色 150
            20: { r: 255, g: 128, b: 0 },
            21: { r: 255, g: 102, b: 0 },
            22: { r: 255, g: 77, b: 0 },
            23: { r: 255, g: 51, b: 0 },
            24: { r: 255, g: 26, b: 0 },
            25: { r: 255, g: 0, b: 0 }, //红色 200
            26: { r: 238, g: 9, b: 26 },
            27: { r: 221, g: 17, b: 51 },
            28: { r: 204, g: 26, b: 77 },
            29: { r: 187, g: 34, b: 102 },
            30: { r: 170, g: 43, b: 128 },
            31: { r: 153, g: 51, b: 153 }, //紫色 300
            32: { r: 153, g: 43, b: 128 },
            33: { r: 153, g: 34, b: 102 },
            34: { r: 153, g: 26, b: 77 },
            35: { r: 153, g: 17, b: 51 },
            36: { r: 153, g: 9, b: 26 },
            37: { r: 153, g: 0, b: 0 } //褐红 400
        };
    };

    exports.default = SpatialGrids;

    /***/
})