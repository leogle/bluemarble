(function() {
    createProjection = function (center, scale, translateX, translateY) {
        var projection = d3.geoMercator()
            .center(center)
            .scale(scale)
            .translate(translateX, translateY);
        return projection
    };

    lnglat2point = function (projection, data) {
        return projection([data.lng, data.lat]);
    };

    project2Point = function (projection, datas) {
        var result = [];
        for (var i = 0; i < datas.length; i++) {
            var data = datas[i];
            var point = projection([data.lng, data.lat]);
            result.push({
                x: point[0],
                y: point[1],
                count: data.count
            });
        }
        return result;
    };

    flatData = function (data,polygon) {
        for(var i = 0;i<data.length;i++){
            if(!pnpoly([data[i].x,data[i].y],polygon)){
                data[i].count=-1;
            }
        }
    };

    flatDataLngLat = function (data,polygon) {
        for(var i = 0;i<data.length;i++){
            if(!pnpoly([data[i].lng,data[i].lat],polygon)){
                data[i].count=-1;
            }
        }
    };

    lnglat2pointArray = function (projection,datas) {
        var result = [];
        for (var i = 0; i < datas.length; i++) {
            var data = datas[i];
            var point = projection([data[0], data[1]]);
            result.push(point);
        }
        return result;
    };
    
    halfData = function (datas) {
        var result = [];
        for (var i = 0; i < datas.length; i+=2) {
            var data = datas[i];
            result.push(data);
        }
        return result;
    };



//最小值
    Array.prototype.min = function() {
        var min = this[0];
        var len = this.length;
        for (var i = 1; i < len; i++){
            if (this[i] < min){
                min = this[i];
            }
        }
        return min;
    };
//最大值
    Array.prototype.max = function() {
        var max = this[0];
        var len = this.length;
        for (var i = 1; i < len; i++){
            if (this[i] > max) {
                max = this[i];
            }
        }
        return max;
    };
})()