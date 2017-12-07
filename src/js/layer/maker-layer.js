(function () {
    MakerLayer = function (option) {

        MakerLayer.prototype = new LayerBase();
        this.configLayer(option);
        this.initLayer();
    };

    MakerLayer.prototype.initLayer = function () {

    };

    MakerLayer.prototype.configLayer = function (option) {
        var element = document.createElement('div');
        element.width = option.map.getSize().width;
        element.height = option.map.getSize().height;
        element.style.position = 'absolute';
        option.layerOption = element;
        this.set('element',element);
        this.set('map',option.map);
        this.set('sytle',option.style);
        var layer = this.prototype.configMap(this,option.map,option);
    };

    MakerLayer.prototype.render = function () {
        console.log('render');
        var self = this.tag || this;
        if(self === null)
            return;
        if (!self.get("data")) {
            return;
        }
        var element = self.get('element');
        var map = self.get('map');
        while(element.hasChildNodes()){
            element.removeChild(element.firstChild);
        }
        self.prototype.resizeMap();
        for(var i = 0;i<data.length;i++){
            var d = data[i];
            var point = map.lnglatToPoint([d.lng,d.lat]);
            var div = document.createElement('div');
            div.top = point.y +'px';
            div.left= point.x +'px';
            div.style.position = 'absolute';

            element.appendChild(div);
        }
    };

    MakerLayer.prototype.update = function (data) {
        this.prototype.set('data',data);
        this.render();
    };
})();