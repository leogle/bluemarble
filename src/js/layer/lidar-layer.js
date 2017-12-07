/**
 * create by lrh
 */
(function () {
    /**
     * 雷达图层
     * @param option {map:generalMap,canvas:canvas,layerOption:canvas}
     * @constructor
     */
    LidarLayer = function (option) {
        var _ = {
            canvas:null,
            physicalLayer:null,
            palette:null,
            map:null,
            radius:5000,
            dataLength:2000,
            rotate:-90
        };

        this.get = function (key) {
            return _[key];
        };

        this.set = function (key, value) {
            _[key] = value;
        };

        this.prototype = new LayerBase();
        this.configLayer(option);
        this.initLayer()
    };

    /**
     * 配置图层
     * @param option{map:generalMap,layerOption:canvas}
     */
    LidarLayer.prototype.configLayer = function (option) {
        this.set('map',option.map);
        this.set('canvas',option.canvas);
        this.set('radius',option.radius||5000);
        this.set('dataLength',option.dataLength||2000);
        var layer = this.prototype.configMap(this,option.map,option);
        this.set('physicalLayer',layer);
    };

    /**
     * 初始化图层
     */
    LidarLayer.prototype.initLayer = function(){
        var self = this;
        var _paleCanvas = document.createElement("canvas");
        _paleCanvas.width = "1";
        _paleCanvas.height = "256";
        var ctx = _paleCanvas.getContext("2d");
        var grad = ctx.createLinearGradient(0, 0, 1, 256);
        var gradient = LidarLayer._getGradientDict();
        for (var x in gradient) {
            grad.addColorStop(x, gradient[x]);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1, 256);
        this.set("palette", ctx.getImageData(0, 0, 1, 256).data);
    };

    /**
     * 渲染函数
     */
    LidarLayer.prototype.render = function () {
        console.log("lidar render");
        var self = this.tag || this;
        if(self == null)
            return;
        var _map = self.get("map");
        var _canvas = self.get("canvas");
        var _palette = self.get("palette");
        var _data = self.get("data");
        var _radius = self.get('radius');
        var _dataLength = self.get('dataLength');

        if(_data == null || _canvas==null)
            return;

        var radioPix = _map.getPixelDistance([_data[0].Lng,_data[0].Lat],_radius);
        console.log(radioPix);
        var rotate = self.get('rotate');
        var center = _map.lnglatToPoint([_data[0].Lng,_data[0].Lat]);
        console.log(center);
        self.prototype.resizeMap();

        paintLidar(_canvas,center,radioPix,_palette,rotate,_dataLength,_data);
        /*
        var context = _canvas.getContext('2d');
        context.imageSmoothingEnabled  = true;
        context.clearRect(0,0,_canvas.width,_canvas.height);
        //绘制底图
        context.fillStyle = 'rgba(42,0,73,0.4)';
        context.beginPath();
        context.moveTo(center.x,center.y);
        context.arc(center.x,center.y,radioPix,(_data[0].Heading+rotate)*Math.PI/180,(_data[_data.length-1].Heading+rotate)*Math.PI/180);
        context.closePath();
        context.fill();
        //绘制雷达扇形
        for(var d = 0;d<_data.length;d++){
            var beam = _data[d];
            //设置渐变
            var grd = context.createRadialGradient(center.x,center.y,0,center.x,center.y,radioPix);
            for(var i=0;i<_dataLength;i++){
                var value = beam.Datas[i];
                var index = Math.floor(value*256);
                //console.log(index);
                if(index<0)
                    index=0;
                if(index>255)
                    index=255;
                var color = 'rgba('+_palette[index*4]+','+_palette[index*4+1]+','+_palette[index*4+2]+','+(0.6+value)+')';
                grd.addColorStop(i/_dataLength,color);
            }
            context.fillStyle = grd;
            //绘制扇形
            context.beginPath();
            context.moveTo(center.x,center.y);
            var stopAngle = beam.Heading+rotate;
            if(d<_data.length-1)
                stopAngle= _data[d+1].Heading+rotate;
            //console.log(beam.Heading);
            context.arc(center.x,center.y,radioPix,(beam.Heading+rotate)*Math.PI/180,stopAngle*Math.PI/180);
            context.closePath();
            context.fill();
            //context.stroke();
        }*/
    };

    /**
     * 更新数据
     * @param data [{Heading:90,Lng:23,Lat:112,Datas:[0.1,0.2,0.3....d},{...}]
     */
    LidarLayer.prototype.update = function (data) {
        this.set('data',data);
        this.render();
    };

    LidarLayer.processData = function (data) {

    };

    /**
     * 颜色字典
     * @returns {{0: string, [0.1]: string, [0.2]: string, [0.3]: string, [0.4]: string, [0.6]: string, [0.8]: string, [1.0]: string}}
     * @private
     */
    LidarLayer._getGradientDict = function () {
        return {
            0: '#000000',
            0.1: '#31167e',
            0.2: '#0006ff',
            0.3: '#008b15',
            0.4: '#5eaf1e',
            0.6: '#ffa000',
            0.8: '#ed0808',
            1.0: '#8e0505'
        };
    };
})();