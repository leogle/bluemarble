/**
 * @author https://github.com/chengquan223
 * @Date 2016-12-15
 * 1.计算矩形4个角的canvas坐标x、y，初始化该区域所有网格点，间距可根据map index设置
 * 2.将已有的站点经纬度转换为canvas坐标
 * 3.插值法计算出每个网格点的风向、风速
 * 4.在该网格区域随机生成width*8个点，重复运动
 */

var Windy = function(options) {
    var MAX_PARTICLE_AGE = 100; //粒子最大运动次数
    var FRAME_RATE = 20; //重绘帧数
    var PARTICLE_MULTIPLIER = 1;

    var canvas = options.canvas;
    var windData = options.data;
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.91)';
    ctx.strokeStyle = 'rgba(71,160,233,1)';

    var buildBounds = function(extent, callback) {
        var upperLeft = extent[0];
        var lowerRight = extent[1];
        var bounds = {
            x: upperLeft[0],
            y: upperLeft[1],
            xmax: lowerRight[0],
            ymax: lowerRight[1],
            width: lowerRight[0] - upperLeft[0],
            height: lowerRight[1] - upperLeft[1]
        };
        callback(bounds);
    };

    var createField = function(columns, bounds, callback) {
        function vector(x, y) {
            var column = columns[Math.floor(x)];
            return column && column[Math.floor(y)];
        }

        vector.release = function() {
            columns = [];
        };

        vector.randomize = function(o) {
            var x = Math.floor(Math.floor(Math.random() * bounds.width) + bounds.x);
            var y = Math.floor(Math.floor(Math.random() * bounds.height) + bounds.y);
            o.x = x;
            o.y = y;
            return o;
        };
        callback(bounds, vector);
    };

    var interpolateGrid = function(bounds, stationPoints, callback) {
        var columns = [];
        var x = bounds.x;

        function interpolateColumn(x) {
            var column = [];
            for (var y = bounds.y; y < bounds.ymax; y += 2) {
                var wind = interpolate(x, y);
                column[y + 1] = column[y] = wind;
            }
            columns[x + 1] = columns[x] = column;
        }

        function interpolate(x, y) {
            var u0 = 0,
                u1 = 0,
                v0 = 0,
                v1 = 0,
                wind = {};
            stationPoints.forEach(function(s) {
                if(s.x<0 || s.y<0)
                    return;
                u0 += s.u * 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));
                u1 += 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));

                v0 += s.v * 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));
                v1 += 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));

                if (u1 != 0) {
                    wind.u = u0 / u1;
                }
                if (v1 != 0) {
                    wind.v = v0 / v1;
                }
            });
            return wind;
        }

        (function batchInterpolate() {
            var start = Date.now();
            while (x < bounds.xmax) {
                interpolateColumn(x);
                x += 2;
                if ((Date.now() - start) > 1000) { //MAX_TASK_TIME
                    setTimeout(batchInterpolate, 25);
                    return;
                }
            }
            createField(columns, bounds, callback);
        })();
    };

    var animate = function(bounds, vector) {
        var particleCount = Math.round(bounds.width * PARTICLE_MULTIPLIER);
        var particles = [];
        for (var i = 0; i < particleCount; i++) {
            particles.push(vector.randomize({
                age: Math.floor(Math.random() * MAX_PARTICLE_AGE)
            }));
        }

        function evolve() {
            particles.forEach(function(particle, i) {
                if (particle.age > MAX_PARTICLE_AGE) {
                    particle = vector.randomize({
                        age: 0
                    });
                    particles.splice(i, 1, particle);
                }
                var x = particle.x;
                var y = particle.y;
                var v = vector(x, y);
                if (v) {
                    //var xe = x - v.speed * Math.sin(Math.PI / 180 * (180 - v.angle));
                    //var ye = y - v.speed * Math.cos(Math.PI / 180 * (180 - v.angle));
                    var xe = x-v.u;
                    var ye = y-v.v;
                    var nextPoint = vector(xe, ye);
                    if (nextPoint) {
                        particle.xe = xe;
                        particle.ye = ye;
                    } else {
                        var newParticle = vector.randomize({
                            age: Math.floor(Math.random() * MAX_PARTICLE_AGE)
                        });
                        particles.splice(i, 1, newParticle);
                    }
                } else {
                    particle.age = MAX_PARTICLE_AGE;
                }
                particle.age += 1;
            });
        }

        function render() {
            var prev = ctx.globalCompositeOperation;
            ctx.fillStyle = 'rgba(0,0,0,0.90)';
            ctx.globalCompositeOperation = "destination-in";
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = prev;

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,1)';
            particles.forEach(function(particle, i) {
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.xe, particle.ye);
                particle.x = particle.xe;
                particle.y = particle.ye;
            });
            ctx.stroke();
        }

        (function frame() {
            try {
                windy.timer = setTimeout(function() {
                    requestAnimationFrame(frame);
                    evolve();
                    render();
                }, 1000 / FRAME_RATE);
            } catch (e) {
                console.error(e);
            }
        })();
    };

    var start = function(extent, stationPoints) {
        stop();

        buildBounds(extent, function(bounds) {
            interpolateGrid(bounds, stationPoints, function(bounds, vector) {
                windy.vector = vector;
                animate(bounds, vector);
            });
        });
    };



    var stop = function() {
        ctx.clearRect(0, 0, width, height);
        if (windy.vector) windy.vector.release();
        if (windy.timer) clearTimeout(windy.timer);
    };

    var change = function(options) {
        ctx.lineWidth = options.size;
        ctx.strokeStyle = options.color;
    };


    var windy = {
        options: options,
        start: start,
        stop: stop,
        change: change
    };

    return windy;
};

window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 20);
        };
})();