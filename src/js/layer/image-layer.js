(function () {
    ImageLayer = function (option) {
        ImageLayer.prototype = new LayerBase();
        this.configLayer(option);
        this.initLayer();
    };

    ImageLayer.prototype.initLayer = function () {

    };

    ImageLayer.prototype.configLayer = function (option) {

    };

    ImageLayer.prototype.render = function () {
        console.log('render');
        var self = this.tag || this;
        if(self == null)
            return;
        if (!self.get("data")) {
            return;
        }
        this.resizeMap();
    };

    ImageLayer.prototype.update = function (data) {
        this.prototype.set('data',data);
        this.render();
    };
})();