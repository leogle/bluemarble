   function myHeatOverlay(opts) {
       //var myHeatOverlay = function(opts) {
       myHeatOverlay.conf = opts;
       myHeatOverlay.conf.intervalPixel = 5;
       myHeatOverlay._map = myHeatOverlay.conf.map;
       myHeatOverlay.data = null;
       // }

       myHeatOverlay.prototype = new BMapLib.HeatmapOverlay({
           "radius": 100,
           "opacity": 0.3,
           "onDraw": function() {
               myHeatOverlay.processData(myHeatOverlay.data);
           }
       });

       this.get = function(url) {
           fetch(url).then(function(response) {
               return response.json().then(function(json) {
                   var point = json.data;
                   myHeatOverlay.data = point;
                   myHeatOverlay.processData(point);
               })
           });
       }

       myHeatOverlay.processData = function(data) {
           var grid = myHeatOverlay.buildGrid();
           var destData = [];
           var pData = myHeatOverlay.toPixelData(data);
           for (var i = 0; i < grid.length; i++) {
               var result = myHeatOverlay.interpolate(pData, grid[i].x, grid[i].y)
               var p = new BMap.Pixel(grid[i].x, grid[i].y);
               destData.push({
                   lng: myHeatOverlay._map.overlayPixelToPoint(p).lng,
                   lat: myHeatOverlay._map.overlayPixelToPoint(p).lat,
                   count: result.count
               });
           }
           myHeatOverlay.prototype.setDataSet({
               data: destData,
               max: 16
           });
       }

       myHeatOverlay.toPixelData = function(data) {
           var destData = [];
           for (var i = 0; i < data.length; i++) {
               var d = data[i];
               if (myHeatOverlay._map.getBounds().containsPoint(new BMap.Point(d.lng, d.lat))) {
                   var pixel = myHeatOverlay._map.pointToOverlayPixel(new BMap.Point(d.lng, d.lat));
                   destData.push({
                       x: pixel.x,
                       y: pixel.y,
                       count: d.count
                   })
               }
           }
           console.log(destData.length);
           return destData;
       }

       myHeatOverlay.buildGrid = function() {
           var currentBounds = myHeatOverlay._map.getBounds();
           var sw = currentBounds.getSouthWest();
           var ne = currentBounds.getNorthEast();
           var lb = myHeatOverlay._map.pointToOverlayPixel(sw);
           var rt = myHeatOverlay._map.pointToOverlayPixel(ne);
           var width = rt.x - lb.x;
           var height = lb.y - rt.y;
           var grid = [];
           for (var i = 0; i <= width / myHeatOverlay.conf.intervalPixel; i++) {
               for (var j = 0; j <= height / myHeatOverlay.conf.intervalPixel; j++) {
                   var x = lb.x + i * myHeatOverlay.conf.intervalPixel;
                   var y = rt.y + j * myHeatOverlay.conf.intervalPixel;
                   var p = new BMap.Pixel(x, y);
                   grid.push({
                       x: x,
                       y: y,
                       //lng: this.map.overlayPixelToPoint(p).lng,
                       //lat: this.map.overlayPixelToPoint(p).lat,
                       count: 0
                   });
               }
           }
           return grid;
       }

       myHeatOverlay.interpolate = function(srcData, x, y) {
           var count0 = 0,
               count1 = 0,
               data = {};
           srcData.forEach(function(s) {
               count0 += s.count * 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));
               count1 += 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));

               if (count1 != 0) {
                   data.count = count0 / count1;
               }
           });
           return data;
       }

   }
   /** 
   function myHeatOverlay(opts) {
       var map = opts.map;
       var point;
       heatmapOverlay2 = new BMapLib.HeatmapOverlay({
           "radius": 10,
           "opacity": 0.3
       });
       map.addOverlay(heatmapOverlay2);
       fetch("/data/co.json").then(function(response) {
           return response.json().then(function(json) {
               point = json.data;

               heatmapOverlay2.setDataSet({
                   data: point,
                   max: 16
               });
           })
       });
   }


   var radarData = {
       center: {
           lng: 34.32,
           lat: 107.88,
       },
       distant: 10,
       datas: [{
           angle: 0,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 1,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 2,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 3,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 4,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 5,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 5, 5, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 6,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 7,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 8,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 9,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }, {
           angle: 10,
           energy: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
       }]
   }


   function RadarOverlay(options) {

       var canvas = options.canvas;
       var map = options.map;
       var data = options.data;
       var center = data.center;
       var max = options.max;
   }
   RadarOverlay.prototype = new BMap.Overlay();

   RadarOverlay.prototype.initialize = function(map) {
       this._map = map;
   }
   var ne = map.pointToOverlayPixel(currentBounds.getNorthEast()),
       sw = map.pointToOverlayPixel(currentBounds.getSouthWest()),
       topY = ne.y,
       leftX = sw.x,
       h = sw.y - ne.y,
       w = ne.x - sw.x;

   var draw = function() {
       ctx = canvas.getContex('2d');
       orgin = map.pointToOverlayPixel(data.center);
       ctx.fillStyle = 'rgba(255,255,255,0.5)';
       ctx.save();
       ctx.translate(100, 100);
       //原点在100,100，则圆心设为0,0 ——> 100,100的佝置
       ctx.arc(0, 0, 100, 30 * Math.PI / 180, 60 * Math.PI / 180);
       //以圆弧终点为起点画直线
       ctx.lineTo(0, 0);
       ctx.rotate(30 * Math.PI / 180);
       //以0,0为起点画直线
       ctx.lineTo(100, 0);
       ctx.stroke();
       ctx.restore();
   }
   }
   */