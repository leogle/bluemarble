(function () {
    /**
     * 图层基类
     * @constructor
     */
    LayerBase = function() {
        var _ = {
          map:null,
        };

        this.get = function (key) {
            return _[key];
        };
        this.set = function (key, value) {
            _[key] = value;
        };

        /**
         * 初始化配置
         */
        this.configLayer = function (GeneralMap) {
        };

        /**
         * 配置图层
         * @param child this
         * @param map generalMap
         * @param options layerOption
         * @returns {layer}
         */
        this.configMap = function (child,map,options) {
            this.set('map',map);
            var layer = map.createCustomLayer(options.layerOption);
            layer.tag = child;
            map.bindRender(layer,child.render);
            this.map = this.get('map').map();
            return layer;
        };

        this.resizeMap = function () {
            var map = this.get('map');
            map.resize();
        };
        /**
         * 渲染函数
         */
        this.render = function () {
            console.log("base render")
        }
    }
})();