module.exports = function (grunt) {
    // 项目配置
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.file %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['src/js/d3map.js',
                    'src/js/layer/general-map.js',
                    'src/js/layer/layer-base.js',
                    'src/js/layer/spatial-layer.js',
                    'src/js/layer/lidar-layer.js',
                'src/js/layer/wind-layer.js',
                ''],
                dest: 'dest/gislayer.min.js'
            }
        }
    });
    // 加载提供"uglify"任务的插件
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // 默认任务
    grunt.registerTask('default', ['uglify']);
}