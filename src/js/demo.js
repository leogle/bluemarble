function getBoundary() {
    var bdary = new BMap.Boundary();

    bdary.get("陕西省", function(rs) { //获取行政区域   
        var count = rs.boundaries.length; //行政区域的点有多少个
        var pointArray = [];
        for (var i = 0; i < count; i++) {
            var ply = new BMap.Polygon(rs.boundaries[i], {
                strokeWeight: 2,
                strokeColor: "#12c3bd",
                fillColor: 'rgba(255,255,255,0.1)'
            }); //建立多边形覆盖物
            map.addOverlay(ply); //添加覆盖物
            pointArray = pointArray.concat(ply.getPath());
        }
    });
    bdary = new BMap.Boundary();

    bdary.get("西安市", function(rs) { //获取行政区域   
        var count = rs.boundaries.length; //行政区域的点有多少个
        var pointArray = [];
        for (var i = 0; i < count; i++) {
            var ply = new BMap.Polygon(rs.boundaries[i], {
                strokeWeight: 2,
                strokeColor: "#12c3bd",
                fillColor: 'rgba(255,255,255,0.1)'
            }); //建立多边形覆盖物
            map.addOverlay(ply); //添加覆盖物
            pointArray = pointArray.concat(ply.getPath());
        }
    });

}

function setChart() {
    $(function() {
        var data = [];
        var header = ['其他', '海盐', '扬尘', '生物燃烧', '机动车尾气', '工业排放', '燃煤', '纯二次无机源'];
        /*
                [
                    ['其他', 20],
                    ['海盐', 15.0],
                    ['扬尘', 36.8],
                    ['生物燃烧', 8.5],
                    ['机动车尾气', 36.2],
                    ['工业排放', 13.2],
                    ['燃煤', 5],
                    ['纯二次无机源', 21]
                ]
                 [{
                name: '其他',
                data: [0.13, 0.1, 0.12, 0.1, 0.1, 0.1, 0.1, 0.1, 0.07, 0.04, 0.1, 0.1, 0.1, 0.1, 0.1]
            }, {
                name: '海盐',
                data: [0.17, 0.17, 0.13, 0.13, 0.16, 0.15, 0.12, 0.18, 0.2, 0.2, 0.12, 0.2, 0.2, 0.2, 0.2]
            }, {
                name: '扬尘',
                data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.2, 0.2, 0.2, 0.17, 0.12, 0.16, 0.2, 0.2]
            }, {
                name: '生物燃烧',
                data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.10, 0.16, 0.1, 0.1, 0.1, 0.1]
            }, {
                name: '机动车尾气',
                data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.1, 0.1, 0.1, 0.1, 0.18, 0.1, 0.1, 0.1]
            }, {
                name: '工业排放',
                data: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.14, 0.1, 0.1]
            }, {
                name: '燃煤',
                data: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]
            }, {
                name: '纯二次无机源',
                data: [0.1, 0.13, 0.15, 0.17, 0.14, 0.15, 0.18, 0.12, 0.13, 0.16, 0.15, 0.1, 0.1, 0.1, 0.1]
            }],*/
        for (var i = 0; i < header.length; i++) {
            data.push({
                name: header[i],
                y: Math.random() * 20
            });
        }
        $('#srcChart').highcharts({
            chart: {
                type: 'pie',
                options3d: {
                    enabled: true,
                    alpha: 45,
                    beta: 0
                },
                backgroundColor: 'rgba(210,210,210,0.1)',
                height: 200,
            },
            title: {
                text: null
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    depth: 20,
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}',
                        style: {
                            color: 'white'
                        }
                    }
                }
            },
            series: [{
                type: 'pie',
                name: '浏览器占比',
                data: data
            }],
            labels: {
                style: {
                    color: "#FFFFFF"
                }
            },
            credits: {
                enabled: false
            }
        });
    });
    $(function() {
        var header = ['其他', '海盐', '扬尘', '生物燃烧', '机动车尾气', '工业排放', '燃煤', '纯二次无机源'];
        var series = [];
        for (var i = 0; i < header.length; i++) {
            var data = [];
            for (var j = 0; j < 14; j++) {
                temp = Math.random() + 0.5;
                data.push(temp);
            }
            series.push({
                name: header[i],
                data: data
            })
        }

        $('#barChart').highcharts({
            chart: {
                type: 'column',
                backgroundColor: 'rgba(210,210,210,0.1)',
                height: 200
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
                tickInterval: 1,
                labels: {
                    style: {
                        color: "#FFFFFF"
                    },
                    rotation: 90
                }
            },
            yAxis: {
                title: null,
                min: 0,
                max: 100,
                tickInterval: 20,
                gridLineWidth: 0,
                lineWidth: 1,
                labels: {
                    style: {
                        color: "#FFFFFF"
                    }
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                column: {
                    stacking: 'percent',
                    borderWidth: 0
                }
            },
            series: series,
            credits: {
                enabled: false
            }
        });
    });
    $(function() {
        $('#barChartCloud').highcharts({
            chart: {
                type: 'column',
                backgroundColor: 'rgba(210,210,210,0.1)',
                height: 270
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['0:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
                labels: {
                    style: {
                        color: "#FFFFFF"
                    }
                }
            },
            yAxis: {
                title: {
                    text: '云底高度（km）',
                    style: {
                        color: 'white'
                    }
                },
                min: 0,
                max: 10,
                tickInterval: 2,
                labels: {
                    style: {
                        color: "#FFFFFF"
                    }
                }
            },
            legend: {
                enabled: false
            },
            series: [{
                name: '高度',
                data: [8.6, 6.6, 7.4, 6.8, 6.1, 5.2, 4.2, 3.1, 4.4, 5.2, 8.0, 7.5, 6.4]
            }],
            plotOptions: {
                column: {
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                        style: {
                            textShadow: '0 0 3px black'
                        }
                    },
                    borderWidth: 0
                }
            },
            credits: {
                enabled: false
            }
        });
    });
}

function updateChart() {

}

function setPupPoint() {
    var pupData = [{
        name: '大唐户县第二热电厂',
        lng: 108.625302,
        lat: 34.072853
    }, {
        name: '大唐陕西发电有限公司灞桥热电厂',
        lng: 109.057542,
        lat: 34.289098
    }, {
        name: '陕西明德集中供热有限责任公司（电子城供热调峰站）',
        lng: 108.93988,
        lat: 34.198238
    }, {
        name: '西安飞机国际航空制造股份有限公司',
        lng: 109.24427,
        lat: 34.646272
    }, {
        name: '西安高新区热力有限公司 西户路热源厂',
        lng: 108.837292,
        lat: 34.202524
    }, {
        name: '西安国维淀粉有限责任公司',
        lng: 108.664311,
        lat: 34.107621
    }, {
        name: '西安蓝田尧柏水泥有限公司',
        lng: 109.267336,
        lat: 34.050073
    }, {
        name: '西安热电有限责任公司',
        lng: 108.851632,
        lat: 34.258768
    }, {
        name: '西安市蔡伦造纸厂（自备热电厂）',
        lng: 108.819353,
        lat: 34.298201
    }, {
        name: '西安市城北供热有限责任公司(城北站)',
        lng: 108.928947,
        lat: 34.383184
    }, {
        name: '西安市城北供热有限责任公司城北站',
        lng: 108.929167,
        lat: 34.944444
    }, {
        name: '西安市热力公司城区分公司',
        lng: 108.943142,
        lat: 34.24896
    }, {
        name: '西安市热力总公司太华供热公司',
        lng: 109.0038,
        lat: 34.31034
    }, {
        name: '西安西京水泥有限责任公司',
        lng: 109.033333,
        lat: 34
    }, {
        name: '西安西联供热有限公司',
        lng: 108.881827,
        lat: 34.276253
    }, {
        name: '西安雁东供热有限公司',
        lng: 109.018653,
        lat: 34.237786
    }];

    var station = [{
        name: "高压开关厂",
        lng: 108.882,
        lat: 34.2749
    }, {
        name: "兴庆小区",
        lng: 108.993,
        lat: 34.2629
    }, {
        name: "纺织城",
        lng: 109.06,
        lat: 34.2572
    }, {
        name: "小寨",
        lng: 108.94,
        lat: 34.2324
    }, {
        name: "市人民体育场",
        lng: 108.954,
        lat: 34.2713
    }, {
        name: "高新西区",
        lng: 108.883,
        lat: 34.2303
    }, {
        name: "经开区",
        lng: 108.935,
        lat: 34.3474
    }, {
        name: "长安区",
        lng: 108.906,
        lat: 34.1546
    }, {
        name: "阎良区",
        lng: 109.2,
        lat: 34.6575
    }, {
        name: "临潼区",
        lng: 109.2186,
        lat: 34.3731
    }, {
        name: "草滩",
        lng: 108.8690,
        lat: 34.3780
    }, {
        name: "曲江文化产业集团",
        lng: 108.985,
        lat: 34.1978
    }, {
        name: "广运潭",
        lng: 109.043,
        lat: 34.3274
    }];

    $(pupData).each(function(i, t) {
        var point = new BMap.Point(t.lng, t.lat);
        var myIcon = new BMap.Icon("images/map-icon-qiye.png", new BMap.Size(50, 50));
        var marker = new BMap.Marker(point, {
            icon: myIcon,
            title: t.name
        });
        map.addOverlay(marker);
    });

    $(station).each(function(i, t) {
        var point = new BMap.Point(t.lng, t.lat);
        var myIcon = new BMap.Icon("images/map-icon-guokong.png", new BMap.Size(50, 50));
        var marker = new BMap.Marker(point, {
            icon: myIcon,
            title: t.name
        });
        map.addOverlay(marker);
    });
}