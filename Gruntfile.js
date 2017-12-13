module.exports = function (grunt) {
    // 项目配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.file %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: [
                    'src/js/layer/general-map.js',
                    'src/js/layer/layer-base.js',
                    'src/js/layer/spatial-layer.js',
                    'src/js/layer/lidar-layer.js',
                    'src/js/layer/wind-layer.js',
                    'src/js/layer/marker-layer.js',
                    'src/js/painter/lidar-painter.js',
                    'src/js/util/palette.js',
                    'src/js/util/pnpoly.js',
                    'src/js/util/d3map.js',
                    'src/js/d3.v4.js',],
                dest: 'dest/gislayer.min.js'
            }
        }
    });
    // 加载提供"uglify"任务的插件
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // 默认任务
    grunt.registerTask('default', ['uglify']);
}