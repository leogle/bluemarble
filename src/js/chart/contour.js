//(function () {
    function ContourChart(opts){
        var _={
            projection:null,
            mapPath : "data/mapdata/",
            locationName:'',
            center:[109.5996,35.7396],
            scale:850,
            legendX:100,
            legendY:200,
            interpolateSize:[100,100],
            mapPolygon:null,
            svg:null,
            path:null,
            color:null,
            legendData:[{name:'1级',value:0},{name:'2级',value:1},{name:'3级',value:2},{name:'4级',value:3},{name:'5级',value:4}],
            legendSize:30,
        };

        this.get = function (key) {
            return _[key];
        };

        this.set = function (key,value) {
            _[key] = value;
        };

        this.init(opts);
    }
    
    ContourChart.prototype.init = function (opts) {
        var self = this;
        self.set('center',opts.center || self.get('center') || [109.5996,35.7396]);
        self.set('scale',opts.scale || self.get('scale') || 850);
        var svg = d3.select(opts.id),
            width = +svg.attr("width"),
            height = +svg.attr("height");
        self.set('svg',svg);
        //墨卡托投影
        var projection = d3.geoMercator()
            .center(self.get('center')) //设置投影中心
            .scale(self.get('scale'))
            .translate([300, height])
        self.set("projection",projection); //平移
        //设置D3地图路径投影
        var path = d3.geoPath().projection(projection);
        self.set('path',path);
        //设置颜色
        var i0 = d3.interpolateHsvLong(d3.hsv(120, 1, 0.65), d3.hsv(60, 1, 0.90)),
            i1 = d3.interpolateHsvLong(d3.hsv(60, 1, 0.90), d3.hsv(0, 0, 0.95)),
            interpolateTerrain = function(t) {
                return t < 0.5 ? i0(t * 2) : i1((t - 0.5) * 2);
            }, color = d3.scaleSequential(interpolateTerrain).domain([0, 5]);
        self.set('color',color);

        this.getMapPath('61');
        this.setLegend();
    };
    //获取该省市地图
    ContourChart.prototype.getMapPath = function(sectorId){
        var self = this;
        var path = this.get('path');
        d3.json(self.get("mapPath")+"china.json",function (error,data) {
            if(error === null){
                var provinces = data.features;
                for(var i = 0; i<provinces.length;i++){
                    var province = provinces[i];
                    if(province.properties.id===sectorId) {
                        self.set('mapPolyon',province.geometry.coordinates[0]);
                    }
                }
            }
        });
        d3.json(self.get('mapPath')+'geometryProvince/'+sectorId+".json", function (error,root) {
            self.get('svg').selectAll("path")
                .data(root.features)
                .enter()
                .append("path")
                .attr("stroke", "#79787a")
                .attr("stroke-width", 1)
                .attr("fill", function(d, i) {
                    return "rgba(100,100,100,0.5)";
                })
                .attr("d", path)
                .text(function (d) {
                    console.log(d.properties.name);
                    return d.properties.name;
                })
        });

    };

    //设置图例
    ContourChart.prototype.setLegend = function () {
        var self = this;
        var legendSize = self.get('legendSize');
        var color = self.get('color');
        var svg = self.get('svg');
        var legendX = self.get('legendX');
        var legendY = self.get('legendY');

        var legend = svg.append("g")
            .selectAll("g")
            .data(this.get('legendData'))
            .enter()
            .append("g");
        legend.append("rect")
            .attr("x",legendX)
            .attr("y",function (d) {
                return d.value*(legendSize+10)+legendY;
            })
            .attr("width",legendSize)
            .attr("height",legendSize)
            .attr("fill",function (d) {
                return color(d.value);
            });
        legend.append("text")
            .attr("x",legendX +legendSize+10)
            .attr("y",function (d) {
                return d.value*(legendSize+10)+legendY+(20);
            })
            .attr("fill","black")
            .text(function (d) {
                return d.name;
            });
    };

    ContourChart.prototype.setData = function (data) {
        var mapPath = this.get('mapPolyon');
        var color = this.get('color');
        var projection = this.get('projection');
        var svg = this.get('svg');
        var size = this.get('interpolateSize');
        //计算插值
        data = this.interpolateGrid(data);
        //将省份地图映射到坐标
        var polygon = lnglat2pointArray(this.get('projection'),mapPath);
        //描边
        flatData(data,polygon);
        //数据坐标映射
        var points = data;
        //var points = project2Point(projection,data);
        var sw = points[0];
        var ne = points[points.length-1];
        var pointwidth = ne.x-sw.x;

        var values = [];
        for(var i =0;i<points.length;i++){
            var point = points[i];
            //var point = points[(size[1]-1-parseInt(i/size[1]))*size[0]+i%size[0]];
            values.push(point.count);
        }
        //生成等高path
        var contours = d3.contours()
            .size(size)
            .thresholds(d3.range(-1, 5, 1))
            (values);
        console.dir(sw);
        console.dir(ne);
        //绘制等高图
        svg.append("g")
            .attr("id","contoursChart")
            .attr("stroke", "steelblue")
            .selectAll("path")
            .data(contours)
            .enter().append("path").attr("stroke-width",0)
            .attr("d", d3.geoPath(d3.geoIdentity().translate([sw.x,sw.y]).scale(pointwidth/size[0])))
            .attr("fill", function(d) {
                if(d.value==-1)
                    return "white";
                return color(d.value);
            })
            .attr("fill-opacity",0.5);
    };

    ContourChart.prototype.interpolateGrid = function (data) {
        var mapPath = this.get('mapPolyon');
        var size = this.get('interpolateSize');
        var polygon = lnglat2pointArray(this.get('projection'),mapPath);
        data = project2Point(this.get('projection'),data);
        var maxX = -200,maxY = -100,minX = 10000,minY=10000;
        for(var i = 0;i<polygon.length;i++){
            var point = polygon[i];
            maxX = maxX<point[0]?point[0]:maxX;
            minX = minX>point[0]?point[0]:minX;
            maxY = maxY<point[1]?point[1]:maxY;
            minY = minY>point[1]?point[1]:minY;
        }

        size[1] = Math.floor((maxY-minY)*size[0]/(maxX-minX));
        var intervalX = (maxX-minX)/size[0];
        var intervalY = (maxY-minY) /size[1];
        this.set('size',size);
        var grid = [];
        for(var y = 0;y<size[1];y++){
            for(var x = 0;x<size[0];x++){
                grid.push({
                    x : minX+intervalX*x,
                    y : minY+intervalY*y,
                    count:0
                });
            }
        }
        for (var i = 0;i<grid.length;i++){
            grid[i].count = this.interpolate(data,grid[i].x,grid[i].y).count;
        }
        return grid;
    };

    ContourChart.prototype.interpolate =  function(srcData, x, y) {
        var count0 = 0,
            count1 = 0,
            data = {};
        srcData.forEach(function (s) {
            count0 += s.count * 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));
            count1 += 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));

            if (count1 != 0) {
                data.count = count0 / count1;
            }
        });
        return data;
    }
    
//})();