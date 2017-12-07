(function () {
    paintSpatial = function (canvas,data,projection,polygon){
        //插值
        //按照画布逐像素点着色
        var _spatialData = _setSpatialData(data,projection);
        var context = canvas.getContext('2d');
        var image = context.createImageData(canvas.width, canvas.height);
        var imgData = image.data;
        var d = _spatialData;
        var dlen = d.length;
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
                if (matrixData[_i2][_j] == '') {

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
        context.putImageData(imgData, 0, 0);
        return image;
    };
    _setSpatialData = function (data,projection) {
        //data:{datas:[{"lat": 40.2929, "value": 21.0, "lng": 116.2266}, {"lat": 39.9301, "value": 16.0, "lng": 116.4233}...]
        //,paramName:"PM10",unit:"ug/m3"}
        if (data === null) {
            return null;
        }
        var _jsonData = data.datas;
        var _jdlen = data.datas.length;
        var _spatialData = [];
        while (_jdlen--) {
            var pixel = projection([_jsonData[_jdlen].lng, _jsonData[_jdlen].lat]);
            _spatialData.push({
                "lng": _jsonData[_jdlen].lng,
                "lat": _jsonData[_jdlen].lat,
                "x": parseInt(pixel[0]),
                "y": parseInt(pixel[1]),
                "value": _jsonData[_jdlen].value
            });
        }
        this.set("paramName", data.paramName);
        this.set("unit", data.unit);
        return _spatialData;
    };
    _getRadioByValue = function (param, value) {
        //根据污染物名称和浓度值计算在图例中显示的颜色比例
        var levelDict = _getParamValueLevelDict(param);
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
    _getParamValueLevelDict = function (param) {
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
})();