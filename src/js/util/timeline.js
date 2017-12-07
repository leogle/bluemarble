(function($) {
    $.fn.extend({
        TimeLine: function(options) {
            var settings = {
                startTime: "2017/07/28",
                endTime: "2017/08/11",
                playTitle: "开始",
                pauseTitle: "暂停",
                width: 1000,
                height: 36,
                playImgUrl: "/TimeLine/img/play.png",
                pauseImgUrl: "/TimeLine/img/pause.png",
                speed: 10000,
                callBack: null
            };

            var opts = $.extend({}, settings, options);
            var helpers = {
                _value: 0,
                _maxValue: 40,
                _step: 1,
                _currentX: 0,
                _index: 0,
                _weekArray: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
                _isStart: false,
                _mProgressTimer: null,
                _scrollBar: null,
                _scrollBarBox: null,
                _scrollTrack: null,
                _scrollThumb: null,
                _timeCode: null,
                _switch: null,
                _init: function($self) {
                    var startButton = "<div class=\"tl_start\" title=\"" + opts.playTitle + "\">";
                    var progressTime = $("<div class=\"tl_progresstime\" style=\"z-index:9\"><div>");
                    var timeSlot = $("<div class=\"tl_timeslot\"></div>");
                    var startTime = new Date(opts.startTime);
                    var endTime = new Date(opts.endTime);
                    var day = this._dateDiff(startTime, endTime);
                    var currentDate = startTime.getDate() < 10 ? "0" + startTime.getDate() : startTime.getDate();
                    var hours = startTime.getHours() < 10 ? "0" + startTime.getHours() : startTime.getHours();
                    var minutes = startTime.getMinutes() < 10 ? "0" + startTime.getMinutes() : startTime.getMinutes();
                    var week = this._weekArray[startTime.getDay()];
                    var ohtml = "";
                    for (var i = 0; i < day; i++) {
                        var nTime = new Date(startTime);
                        nTime.setDate(startTime.getDate() + i);
                        var nWeek = this._weekArray[nTime.getDay()];
                        var dayNum = nTime.getDate() < 10 ? "0" + nTime.getDate() : nTime.getDate();
                        var monthNum = nTime.getMonth() + 1;
                        var monthNum = monthNum < 10 ? "0" + monthNum : monthNum;
                        if ((opts.width / day) > 70) {
                            ohtml += '<p>' + nWeek + ' ' + monthNum + "/" + dayNum + '</p>';
                        } else {
                            ohtml += '<p>' + monthNum + "/" + dayNum + '</p>';
                        }

                    }
                    $(timeSlot).append(ohtml).find("p").css({ "width": "calc(" + 100 / day + "% - 1px)", "line-height": opts.height + "px", "height": opts.height + "px" });
                    var content = $("<div class=\"tl_content\"></div>");
                    var scrollBarBox = $("<div class=\"tl_scrollbarbox\"></div>");
                    var scrollBar = $("<div class=\"tl_scrollbar\"></div>");
                    var scrollTrack = "<div class=\"tl_scrolltrack\"></div>";
                    var scrollThumb = "<div class=\"tl_scrollthumb\">" + (week + " - " + hours + ":" + minutes) + "</div>";
                    scrollBar.append(scrollTrack).append(scrollThumb);
                    scrollBarBox.append(scrollBar);
                    var timeCode = "<div class=\"tl_timecode\">" + (hours + ":" + minutes) + "</div>";
                    $(content).append(scrollBarBox);
                    $(content).append(timeCode);
                    $(progressTime).append(timeSlot);
                    $(progressTime).append(content);
                    $(progressTime).width(opts.width);
                    $(progressTime).height(opts.height);
                    $self.append(startButton);
                    $self.append(progressTime);
                    this._maxValue = Math.abs(startTime - endTime) / 1000 / 60 / 60;
                    this._scrollBar = $self.find(".tl_scrollbar");
                    this._scrollBarBox = $self.find(".tl_scrollbarbox");
                    this._scrollTrack = $self.find(".tl_scrolltrack");
                    this._scrollThumb = $self.find(".tl_scrollthumb");
                    this._timeCode = $self.find(".tl_timecode");
                    this._switch = $self.find(".tl_start");
                    //$self.css("padding-top", "40px");
                    this._switch.css({ "background-image": "url(" + opts.playImgUrl + ")", "height": opts.height + "px" });
                    this._currentX = this._scrollBar.width() * (this._value / this._maxValue);
                    this._BindEvent();
                },
                _dateDiff: function(sd, ed) {
                    return (ed.getTime() - sd.getTime()) / (1000 * 3600 * 24);
                },
                _setValue: function(v) {
                    this._value = v;
                    if (this._value >= this._maxValue) this._value = this._maxValue;
                    if (this._value <= 0) this._value = 0;
                    var mWidth = this._value / this._maxValue * this._scrollBar.width(); + "px";
                    this._scrollTrack.css("width", mWidth);
                    this._scrollThumb.css("margin-left", mWidth);
                },
                _setTips: function(v) {
                    var startTime = new Date(opts.startTime);
                    startTime.setHours(startTime.getHours() + 1 * v);
                    var month = startTime.getMonth() + 1 < 10 ? "0" + (startTime.getMonth() + 1) : startTime.getMonth() + 1;
                    var currentDate = startTime.getDate() < 10 ? "0" + startTime.getDate() : startTime.getDate();
                    var Hours = startTime.getHours() < 10 ? "0" + startTime.getHours() : startTime.getHours();
                    var Minutes = startTime.getMinutes() < 10 ? "0" + startTime.getMinutes() : startTime.getMinutes();
                    var Seconds = startTime.getSeconds() < 10 ? "0" + startTime.getSeconds() : startTime.getSeconds();
                    var indexStart = startTime.getFullYear() + "/" + month + "/" + currentDate + " " + Hours + ":" + Minutes + ":" + Seconds;
                    var week = this._weekArray[startTime.getDay()];
                    this._scrollThumb.html(week + " - " + Hours + ":" + Minutes);
                    if (window.parent.currentTime) {
                        currentTime = indexStart;
                    }
                    if (typeof(opts.callBack) == "function") {
                        var jscode = new Function('return ' + opts.callBack)();
                        jscode(indexStart)
                    }
                },
                _setSlideTips: function(v) {
                    var startTime = new Date(opts.startTime);
                    startTime.setHours(startTime.getHours() + 1 * v);
                    var Hours = startTime.getHours() < 10 ? "0" + startTime.getHours() : startTime.getHours();
                    var Minutes = startTime.getMinutes() < 10 ? "0" + startTime.getMinutes() : startTime.getMinutes();
                    this._timeCode.html(Hours + ":" + Minutes);
                },
                _progressTimeStop: function() {
                    this._switch.attr("title", opts.playTitle);
                    this._switch.css("background-image", "url(" + opts.playImgUrl + ")");
                    this._isStart = false;
                    this._scrollThumb.css("margin-left", "0px");
                    this._scrollTrack.css("width", "0px");
                    this._value = 0;
                    this._index = 0;
                    this._setTips(this._value);
                    this._setInterval(this._index);
                },
                _setInterval: function(index) {
                    window.clearInterval(this._mProgressTimer);
                    if (!this._isStart) {
                        this._setValue(index);
                        this._setTips(index);
                    } else {
                        this._mProgressTimer = window.setInterval(function() {
                            if (helpers._index <= helpers._maxValue) {
                                helpers._index += 1;
                                helpers._setValue(helpers._index);
                                helpers._setTips(helpers._index)
                            } else {
                                helpers._progressTimeStop()
                            }
                        }, opts.speed);
                    }
                },
                _BindEvent: function() {
                    var currentValue;
                    this._scrollBarBox.click(function(event) {
                        var changeX = event.clientX - helpers._currentX;
                        currentValue = changeX - helpers._currentX - helpers._scrollBar.offset().left;
                        var sWidth = helpers._scrollBar.width();
                        helpers._scrollThumb.css("margin-left", currentValue + "px");
                        helpers._scrollTrack.css("width", currentValue + 2 + "px");
                        if ((currentValue + 1) >= sWidth) {
                            helpers._scrollThumb.css("margin-left", sWidth - 1 + "px");
                            helpers._scrollTrack.css("width", sWidth + 2 + "px");
                            helpers._value = helpers._maxValue;
                        } else if (currentValue <= 0) {
                            helpers._scrollThumb.css("margin-left", "0px");
                            helpers._scrollTrack.css("width", "0px");
                            helpers._value = 0;
                        } else {
                            helpers._value = Math.round(currentValue * helpers._maxValue / sWidth);
                        }
                        helpers._setTips(helpers._value);
                        helpers._setInterval(helpers._value);
                        helpers._index = helpers._value;
                    });

                    this._scrollBarBox.mousemove(function(event) {
                        var changeX = event.clientX - helpers._currentX;
                        currentValue = changeX - helpers._currentX - helpers._scrollBar.offset().left;
                        var sWidth = helpers._scrollBar.width();
                        helpers._timeCode.show().css("left", currentValue - 28 + "px");
                        if ((currentValue + 1) >= sWidth) {
                            helpers._timeCode.css("left", sWidth - 43 + "px");
                            helpers._value = helpers._maxValue;
                        } else if (currentValue <= 0) {
                            helpers._timeCode.css("left", "-28px");
                            helpers._value = 0;
                        } else {
                            helpers._value = Math.round(currentValue * helpers._maxValue / sWidth);
                        }
                        helpers._setSlideTips(helpers._value);
                        helpers._timeCode.show();
                    });

                    this._scrollBarBox.mouseout(function(event) {
                        helpers._timeCode.hide();
                    });

                    this._switch.click(function(event) {
                        if (helpers._isStart) {
                            helpers._switch.attr("title", opts.playTitle);
                            helpers._switch.css("background-image", "url(" + opts.playImgUrl + ")");
                            window.clearInterval(helpers._mProgressTimer);
                            helpers._isStart = false;
                        } else {
                            helpers._isStart = true;
                            helpers._switch.attr("title", opts.pauseTitle);
                            helpers._switch.css("background-image", "url(" + opts.pauseImgUrl + ")");
                            helpers._mProgressTimer = window.setInterval(function() {
                                if (helpers._index <= helpers._maxValue) {
                                    helpers._index += 1;
                                    helpers._setValue(helpers._index);
                                    helpers._setTips(helpers._index);
                                } else {
                                    helpers._progressTimeStop()
                                }
                            }, opts.speed);
                        }
                    });
                }
            };

            return this.each(function() {
                var $self = $(this);
                helpers._init($self);
            });
        }
    });
})(window.jQuery);