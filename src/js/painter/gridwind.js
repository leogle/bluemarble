/**
 * @author lrh
 * @Date 2018-02-02
 * 使用网格化数据进行风场渲染
 */

var GridWind = function(options) {
    var _ = {
        canvas:null,
        physicalLayer:null,
        map:null,
        windy:null
    };

    var get = function (key) {
        return _[key];
    };

    var set = function (key, value) {
        _[key] = value;
    };
    var NULL_WIND_VECTOR = [NaN, NaN, null];
    var HOLE_VECTOR = [NaN, NaN, null];

    var MAX_PARTICLE_AGE = 100;
    var FLYSPEED = 0.13;

    var FRAME_RATE = 20; //重绘帧数
    var PARTICLE_MULTIPLIER = 1;

    var canvas = options.canvas;
    var windData = options.data;
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext('2d');
    var map = options.map;


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
    /**
     * 网格化插值
     * @param grid
     * @param λ
     * @param φ
     * @param λ0
     * @param Δλ
     * @param φ0
     * @param Δφ
     * @returns {*}
     */
    var interpolate = function (grid, λ, φ, λ0, Δλ, φ0, Δφ) {
        var i = floorMod(λ - λ0, 360) / Δλ;
        var j = (φ0 - φ) / Δφ;

        var fi = Math.floor(i),
            ci = fi + 1;
        var fj = Math.floor(j),
            cj = fj + 1;

        var row;
        if (row = grid[fj]) {
            var g00 = row[fi];
            var g10 = row[ci];
            if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
                var g01 = row[fi];
                var g11 = row[ci];
                if (isValue(g01) && isValue(g11)) {
                    return interpolateWindVector(i - fi, j - fj, g00, g10, g01, g11);
                }
            }
        }
        return null;
    };

    /**
     *
     * @param x
     * @param y
     * @param g00
     * @param g10
     * @param g01
     * @param g11
     * @returns {*[]}
     */
    var interpolateWindVector = function (x, y, g00, g10, g01, g11) {
        var rx = 1 - x;
        var ry = 1 - y;
        var a = rx * ry,
            b = x * ry,
            c = rx * y,
            d = x * y;
        var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
        var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
        return [u, v, Math.sqrt(u * u + v * v)];
    };
    /*
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
                var angle0 = 0,
                    angle1 = 0,
                    speed0 = 0,
                    speed1 = 0,
                    wind = {};
                stationPoints.forEach(function(s) {
                    angle0 += s.angle * 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));
                    angle1 += 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));

                    speed0 += s.speed * 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));
                    speed1 += 1.0 / ((y - s.y) * (y - s.y) + (x - s.x) * (x - s.x));

                    if (angle1 != 0) {
                        wind.angle = angle0 / angle1;
                    }
                    if (speed1 != 0) {
                        wind.speed = speed0 / speed1;
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
                        var xe = x - v.speed * Math.sin(Math.PI / 180 * (180 - v.angle));
                        var ye = y - v.speed * Math.cos(Math.PI / 180 * (180 - v.angle));
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
    */
    var start = function(extent, stationPoints) {
        var datas = get("data");
        if (datas == null) {
            return;
        }
        var grid =get("grid");
        //var canvas = get("canvas");
        var clean=true;
        var header = datas[0].header;
        var λ0 = header.lo1,
            φ0 = header.la1;
        var Δλ = header.dx,
            Δφ = header.dy;
        var ni = header.nx,
            nj = header.ny;
        var date = new Date(header.refTime);
        date.setHours(date.getHours() + header.forecastTime);

        //高德地图的经度从西-180到东180，纬度从北90到南-90
        //暂停动画
        clearInterval(get("timerID"));

        if (clean) {
            var g = canvas.getContext("2d");
            g.clearRect(0, 0, canvas.width, canvas.height);
        }

        var xside = [];
        var yside = [];
        for (var x = 0; x <= canvas.width; x += 2) {
            var agps = map.pointToLngLat([x,0]);
            var ggps = lngLatA2G(agps.lng, agps.lat);
            xside[x + 1] = xside[x] = ggps.lng;
        }
        for (var y = 0; y <= canvas.height; y += 2) {
            var agps = map.pointToLngLat([0,y]);
            var ggps = lngLatA2G(agps.lng, agps.lat);
            yside[y + 1] = yside[y] = ggps.lat;
        }

        var columns = [];
        for (var x = 0; x <= canvas.width; x += 2) {
            var column = [];
            for (var y = 0; y <= canvas.height; y += 2) {
                var ggps = { lng: xside[x], lat: yside[y] };

                var wind = interpolate(grid, ggps.lng, ggps.lat, λ0, Δλ, φ0, Δφ);
                if (wind) {
                    wind = distort(wind, FLYSPEED);
                }
                column[y + 1] = column[y] = wind || HOLE_VECTOR;
            }
            columns[x + 1] = columns[x] = column;
        }
        set("columns", columns);
        set("timerID", setInterval(function () {
            animate(map.getZoom());
        }.bind(this), 40));
    };

    var animate = function (maplevel) {
        var particles = get("particles");
        var buckets = colorStyles.map(function () {
            return [];
        });
        var columns = get("columns");
        //var canvas = get("canvas");
        var g = canvas.getContext("2d");
        g.lineWidth = getParticleConfig(maplevel).width;
        g.fillStyle = get("fadeFillStyle");

        particles.forEach(function (particle) {
            if (particle.age > MAX_PARTICLE_AGE) {
                randomize(particle, 0, canvas.width, 0, canvas.height).age = 0;
            }
            var x = particle.x;
            var y = particle.y;
            var v = getVector(columns, x, y);
            var m = v[2];
            if (m === null) {
                particle.age = 100;
            } else {
                var xt = x + v[0];
                var yt = y + v[1];
                if (true) {
                    particle.xt = xt;
                    particle.yt = yt;
                    buckets[colorStyles.indexFor(m)].push(particle);
                } else {
                    particle.x = xt;
                    particle.y = yt;
                }
            }
            particle.age += 1;
        });
        set("buckets", buckets);

        var prev = g.globalCompositeOperation;
        g.globalCompositeOperation = "destination-in";
        g.fillRect(0, 0, canvas.width, canvas.height);
        g.globalCompositeOperation = prev;

        buckets.forEach(function (bucket, i) {
            if (bucket.length > 0) {
                g.beginPath();
                g.strokeStyle = colorStyles[i];
                bucket.forEach(function (particle) {
                    g.moveTo(particle.x, particle.y);
                    g.lineTo(particle.xt, particle.yt);
                    particle.x = particle.xt;
                    particle.y = particle.yt;
                });
                g.stroke();
            }
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

    var update = function (data) {
        var render = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        var datas = data || get("data");
        //初始化GFS格点数据
        var uData = datas[0].data;
        var vData = datas[1].data;
        var header = datas[0].header;

        var λ0 = header.lo1,
            φ0 = header.la1;
        var Δλ = header.dx,
            Δφ = header.dy;
        var ni = header.nx,
            nj = header.ny;

        var grid = [],
            p = 0;
        var isContinuous = Math.floor(ni * Δλ) >= 360;
        for (var j = 0; j < nj; j++) {
            var row = [];
            for (var i = 0; i < ni; i++, p++) {
                row[i] = [uData[p], vData[p]];
            }
            if (isContinuous) {
                row.push(row[0]);
            }
            grid[j] = row;
        }
        //grid是列索引从南0-北180，行索引从西0-东361，对应的GFS的经纬度格式
        set("grid", grid);
        //如果初始化的时候没有data，则此时需要创建粒子
        if (get("data") == null) {
            set("data", data);
            updataParticles();
        } else {
            set("data", data);
        }
        if (render) {
            start();
        }
    };
    var updataParticles = function () {
        //var map = get("map");
        //var canvas = get("canvas");
        var multiplier = getParticleConfig(map.getZoom()).multiplier;
        var particleCount = Math.round(canvas.width * multiplier);
        var particles = [];
        for (var i = 0; i < particleCount; i++) {
            particles.push(randomize({ age: Math.round(Math.random() * MAX_PARTICLE_AGE) }, 0, canvas.width, 0, canvas.height));
        }
        set("particles", particles);
        return particles;
    };
    var isValue = function (x) {
        return x !== null && x !== undefined;
    };
    var windIntensityColorScale = function (step, maxWind) {
        var result = [];
        for (var j = 220; j <= 255; j += step) {
            result.push(asColorStyle(77, 147, 206, 1.0));
        }
        result.indexFor = function (m) {
            // map wind speed to a style
            return Math.floor(Math.min(m, maxWind) / maxWind * (result.length - 1));
        };
        return result;
    };
    var floorMod = function (a, n) {
        var f = a - n * Math.floor(a / n);
        return f === n ? 0 : f;
    };
    var lngLatA2G = function (alng, alat) {
        return { lng: alng, lat: alat };
    };
    var distort = function (wind, scale) {
        wind[0] = wind[0] * scale;
        wind[1] = wind[1] * scale * -1;
        return wind;
    };
    var getVector = function (columns, x, y) {
        var column = columns[Math.round(x)];
        return column && column[Math.round(y)] || NULL_WIND_VECTOR;
    };

    /**
     * 返回粒子数和线条宽度
     * @param mapLevel
     * @returns {{multiplier: number, width: number}}
     */
    var getParticleConfig = function (mapLevel) {
        if (contains([1, 2, 3], mapLevel)) {
            //国家级
            return { multiplier: 4, width: 1 };
        } else if (contains([4, 5, 6, 7], mapLevel)) {
            //城市级
            return { multiplier: 1, width: 1 };
        } else if (contains([8, 9, 10], mapLevel)) {
            //区县级
            return { multiplier: 0.5, width: 1 };
        } else if (contains([8, 9, 10, 11, 12, 13], mapLevel)) {
            //街道级
            return { multiplier: 0.5, width: 1 };
        } else {
            //站点级[14,15..18]
            return { multiplier: 0.4, width: 1 };
        }
    };

    var randomize = function (o, xMin, xMax, yMin, yMax) {
        var x, y;
        x = Math.round(xMin + Math.random() * (xMax - xMin));
        y = Math.round(yMin + Math.random() * (yMax - yMin));
        o.x = x;
        o.y = y;
        return o;
    };

    var contains = function (arr, v) {
        if ($.inArray(v, arr) > -1) {
            return true;
        }
        return false;
    };
    var asColorStyle = function (r, g, b, a) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    };
    var colorStyles = windIntensityColorScale(10, 17);

    var windy = {
        options: options,
        start: start,
        stop: stop,
        change: change,
        update:update
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