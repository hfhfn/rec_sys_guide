/**
 * Created by Villen on 18/7/18.
 */
var callBack={
    date: [
        "2018-07-04",
        "2018-07-05",
        "2018-07-06",
        "2018-07-07",
        "2018-07-08",
        "2018-07-09"
    ],
    weibo_url: "https://weibo.com/caizicaixukun",
    aiman_fans_num: "12995424",
    num: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
    ],
    first_forward_num: "50017150",
    province_num: [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
    ],
    female: 72,
    first_comment_num: "771319",
    key: "baidu_sex",
    provinces: [
        "广东",
        "江苏",
        "浙江",
        "山东",
        "河南",
        "四川",
        "河北",
        "安徽",
        "福建",
        "湖北"
    ],
    fans_num: "12995424",
    first_like_num: "1221791",
    male_num: 28,
    media_num: "19",
    news_num: "172",
    female_num: 72,
    name: "蔡徐坤",
    active_fans_num: "192641",
    index_date: [
        "2018-07-06",
        "2018-07-07",
        "2018-07-08",
        "2018-07-09",
        "2018-07-10",
        "2018-07-11"
    ],
    index_num: [
        "86335",
        "100020",
        "107816",
        "30302",
        "87237",
        "88421"
    ],
    position: "歌手、演员",
    aiman_date: "2018-07-13",
    weibo_name: "蔡徐坤",
    pic_url: "http://img.iminer.com/ireport/upload/7/141848/20180417142653512.jpg",
    age_num: [
        4,
        9,
        65,
        21,
        1
    ],
    age: [
        "19岁及以下",
        "20~29岁",
        "30~39岁",
        "40~49岁",
        "50岁以上"
    ],
    male: 28
}
//曲线图
function initChartsLine(date,data) {
    //百度指数
    var dom = document.getElementById("baiduzhishu");
    var myChart = echarts.init(dom);
    var app = {};
    var start = (data.length)>10 ? 100-(7/(date.length)*100) : 0;
    //console.log(start)
    option = {
        tooltip: {
            trigger: 'axis',
            position: function (pt) {
                return [pt[0], '10%'];
            }
        },
        title: {
            left: 'center',
            text: '',
        },

        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: date
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%']
        },
        dataZoom: [{
            type: 'inside',
            start: start,
            end: 100,
            disabled:true
        }, {
            start: start,
            end: 100,
            handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            handleSize: '80%',
            handleStyle: {
                color: '#fff',
                shadowBlur: 3,
                shadowColor: 'rgba(0, 0, 0, 0.6)',
                shadowOffsetX: 2,
                shadowOffsetY: 2
            }
        }],
        series: [
            {
                name:'指数 ',
                type:'line',
                smooth:true,
                symbol: 'none',
                sampling: 'average',
                itemStyle: {
                    normal: {
                        color: '#30a3f4'
                    }
                },
                areaStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#30a3f4'
                        }, {
                            offset: 1,
                            color: '#30a3f4'
                        }])
                    }
                },
                data: data
            }
        ]
    };

    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
}
//年龄柱状图
function initChartsBar(age,age_num) {
    var dom = document.getElementById("age");
    var myChart = echarts.init(dom);
    var app = {};
    var option = {
        /*title: {
         x: 'left',
         text: '年龄分布'
         },*/
        tooltip: {
            trigger: 'item',
            formatter: '{b}:\n{c}%'
        },

        /*toolbox: {
         show: true,
         feature: {
         dataView: {show: true, readOnly: false},
         restore: {show: true},
         saveAsImage: {show: true}
         }
         },*/

        xAxis: {
            type: 'category',
            data: age
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value} %',
            },
        },
        series: [{
            data: age_num,
            type: 'bar',
            itemStyle:{
                normal: {
                    color:'#30a3f4'
                }
            }

        }]

    };

    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
}
//性别分布
function initChartsSex(male_num,female_num) {
    var dom = document.getElementById("sex");
    var myChart = echarts.init(dom);
    var app = {};
    var option = {
        /*title: {
         text: '性别分布',
         left: 'left'
         },*/
        tooltip : {
            trigger: 'item',
            formatter: "{b} : ({d}%)"
        },
        legend: {
            bottom: 10,
            left: 'center',
            data: ['男', '女']
        },
        color:['#30a3f4', '#ff438e'],
        series : [
            {
                type: 'pie',
                radius : '65%',
                center: ['50%', '50%'],
                selectedMode: 'single',
                data:[
                    {value:male_num, name: '男'},
                    {value:female_num, name: '女'}
                ],
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };
    ;
    if (option && typeof option === "object") {
        myChart.setOption(option, true);
    }
}
//地图
function initChartsPosition(province,num) {
    var mydata = [
        {name: '北京',value:0 },{name: '天津',value: 0 },
        {name: '上海',value:0 },{name: '重庆',value:0 },
        {name: '河北',value:0 },{name: '河南',value:0 },
        {name: '云南',value:0 },{name: '辽宁',value:0 },
        {name: '黑龙江',value:0 },{name: '湖南',value:0 },
        {name: '安徽',value:0 },{name: '山东',value:0 },
        {name: '新疆',value:0 },{name: '江苏',value:0 },
        {name: '浙江',value:0 },{name: '江西',value:0 },
        {name: '湖北',value:0 },{name: '广西',value:0 },
        {name: '甘肃',value:0 },{name: '山西',value:0 },
        {name: '内蒙古',value:0 },{name: '陕西',value:0 },
        {name: '吉林',value:0 },{name: '福建',value:0 },
        {name: '贵州',value:0 },{name: '广东',value:0 },
        {name: '青海',value:0 },{name: '西藏',value:0 },
        {name: '四川',value:0 },{name: '宁夏',value:0 },
        {name: '海南',value:0 },{name: '台湾',value:0 },
        {name: '香港',value:0 }
    ];

    mydata.forEach(function (arr,index) {
        var ind = province.indexOf(arr.name);
        if(ind>-1){
            mydata[index].value=num[ind];
        }
    })
    var optionMap = {
        backgroundColor: '#fff',
        title: {
            text: '',
            subtext: '',
            x:'left'
        },
        tooltip : {
            trigger: 'item'
        },
        //左侧小导航图标
        visualMap: {
            show : true,
            x: '30px',
            y: '50px',
            inverse:true,
            // min: 1,
            // max: 34,
            // text: ['低','高'],
            splitList: [
                {start: 1, end: 6, label: '1 - 6', color: '#30a3f4'},
                {start: 7, end: 13, label: '7 - 13', color: '#39d3ff'},
                {start: 14, end: 20, label: '14 - 20', color: '#a8ecff'},
                {start: 21, end: 27, label: '21 - 27', color: '#d4f6ff'},
                {start: 28, end: 34, label: '28 - 34', color: '#eefbff'}
            ]
            // color: ['#eefbff','#d4f6ff','#a8ecff','#39d3ff', '#30a3f4']
        },
        //配置属性
        series: [{
            name: '排名',
            type: 'map',
            mapType: 'china',
            roam: false,
            label: {
                normal: {
                    show: true  //省份名称
                },
                emphasis: {
                    show: false
                },
                textStyle: {
                    color: "red"
                }
            },
            itemStyle:{
                emphasis:{
                    areaColor: '',
                },
            },

            data:mydata  //数据
        }]
    };
    //初始化echarts实例
    var myChart = echarts.init(document.getElementById('position'));

    //使用制定的配置项和数据显示图表
    myChart.setOption(optionMap);

    /*城市*/
    var cityDom = '<h3 style="margin-bottom: 20px;">省份排名前十</h3>';
    for(var i=0;i<10;i++){
        var min = Math.min.apply({}, num)+'';
        var index = num.indexOf(min);
        var long = (33-min*1.5)/33*135;
        cityDom += '<div class="city-list"> <span class="city-name">'+province[index]+'</span><span class="city-line" style="width: '+long+'px"></span> </div>';
        num.splice(index, 1);
        province.splice(index, 1);
    }
    $('.tongji-city').html(cityDom)


}

function formatNumber(num, precision, separator) {
    var parts;
    // 判断是否为数字
    if (!isNaN(parseFloat(num)) && isFinite(num)) {
        // 把类似 .5, 5. 之类的数据转化成0.5, 5, 为数据精度处理做准, 至于为什么
        // 不在判断中直接写 if (!isNaN(num = parseFloat(num)) && isFinite(num))
        // 是因为parseFloat有一个奇怪的精度问题, 比如 parseFloat(12312312.1234567119)
        // 的值变成了 12312312.123456713
        num = Number(num);
        // 处理小数点位数
        num = (typeof precision !== 'undefined' ? num.toFixed(precision) : num).toString();
        // 分离数字的小数部分和整数部分
        parts = num.split('.');
        // 整数部分加[separator]分隔, 借用一个著名的正则表达式
        parts[0] = parts[0].toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + (separator || ','));

        return parts.join('.');
    }
    return NaN;
}

//异步搜索
function getStarInfo(star_name) {
    $('.no-result').addClass('hidden');
    $('.star-con').addClass('hidden');
    $.ajax({
        type:'GET',
        url:GlobalParam.apiHost+'/search_star/?star_name='+star_name,
        dataType:'json',
        success:function (callBack) {
            //console.log(callBack);
            if(callBack.msg=="Nothing found!"){
                $('.star-con').addClass('hidden');
                $('.no-result').removeClass('hidden');
                $('.no-result span').text(star_name);
            }else{
                $('.star-con').removeClass('hidden');
                var shortURL=top.location.href.substring(0,top.location.href.indexOf('?'));
                history.replaceState(null,null,shortURL+'?star_name='+star_name);
                //设置值
                $('.star-top img').attr('src',callBack.pic_url);
                $('.star-name').eq(0).text(callBack.name);
                var _rank = callBack.star_rank ? '<span>'+callBack.star_rank+'</span>' : "<small>待定</small>";
                $('.star-rank .blue-bg').eq(0).html('排名 '+_rank);
                $('.star-rank>span').text(callBack.hot_index || '未定');
                //微博
                var counts = $('.star-counts span');
                counts.eq(0).text(formatNumber(callBack.first_forward_num));
                counts.eq(1).text(formatNumber(callBack.first_comment_num));
                counts.eq(2).text(formatNumber(callBack.first_like_num));
                counts.eq(3).text(formatNumber(callBack.chaohua_read_num));
                counts.eq(4).text(formatNumber(callBack.chaohua_topic_num));
                counts.eq(5).text(formatNumber(callBack.chaohua_fans_num));
                counts.eq(6).text(formatNumber(callBack.weibo_fans_num));
                counts.eq(7).text(formatNumber(callBack.active_fans_num));
                counts.eq(8).text(callBack.news_num);
                counts.eq(9).text(callBack.media_num);
                //作品
                var table=false,
                    table_dom='';
                if(callBack.works && callBack.works.length>0){
                    table=true;
                    table_dom += '<div class="blue-bg">即将上线的作品</div> <div class="table-con table-tr"> <div class="">作品名</div> <div class="">角色扮演</div> <div class="">合作演员</div> </div>';
                    callBack.works.forEach(function (item) {
                        var tr = callBack[item];
                        table_dom +='<div class="table-con"> <div class="">'+tr[0]+'</div> <div class="">'+tr[2]+'</div> <div class="">'+(tr[3] || "未知")+'</div> </div>';
                    })
                }
                if(callBack.brand){
                    table=true;
                    table_dom += '<div class="blue-bg">已代言品牌</div><div class="table-con table-tr"> <div style="width: 100%;height: 100px;display: flex; justify-content: center; align-items: center;">'+callBack.brand+'</div> </div>';
                }

                var quanyi_dom = '',
                    price='',
                    quan=false;
                if(callBack.huodong==1){
                    if(callBack.huodongMin && callBack.huodongMax){
                        if(callBack.huodongMin!=callBack.huodongMax){
                            price=callBack.huodongMin+'万-'+callBack.huodongMax+'万';
                        }else{
                            price=callBack.huodongMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">商业站台活动</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(callBack.long==1){
                    if(callBack.longMin && callBack.longMax){
                        if(callBack.longMin!=callBack.longMax){
                            price=callBack.longMin+'万-'+callBack.longMax+'万';
                        }else{
                            price=callBack.longMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">长期代言</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(callBack.short==1){
                    if(callBack.shortMin && callBack.shortMax){
                        if(callBack.shortMin!=callBack.shortMax){
                            price=callBack.shortMin+'万-'+callBack.shortMax+'万';
                        }else{
                            price=callBack.shortMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">短期代言（3/6个月）</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(callBack.record==1){
                    if(callBack.recordMin && callBack.recordMax){
                        if(callBack.recordMin!=callBack.recordMax){
                            price=callBack.recordMin+'万-'+callBack.recordMax+'万';
                        }else{
                            price=callBack.recordMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    price= callBack.recordMin ? callBack.recordMin+'万-'+callBack.recordMax+'万' : '待议';
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">ID录制</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(callBack.book==1){
                    if(callBack.bookMin && callBack.bookMax){
                        if(callBack.bookMin!=callBack.bookMax){
                            price=callBack.bookMin+'万-'+callBack.bookMax+'万';
                        }else{
                            price=callBack.bookMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">小红书</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(callBack.bus==1){
                    if(callBack.busMin && callBack.busMax){
                        if(callBack.busMin!=callBack.busMax){
                            price=callBack.busMin+'万-'+callBack.busMax+'万';
                        }else{
                            price=callBack.busMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">商业微博</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(callBack.portrait==1){
                    if(callBack.portraitMin && callBack.portraitMax){
                        if(callBack.portraitMin!=callBack.portraitMax){
                            price=callBack.portraitMin+'万-'+callBack.portraitMax+'万';
                        }else{
                            price=callBack.portraitMin+'万';
                        }
                    }else{
                        price='待议';
                    }
                    quanyi_dom += '<div class="table-con table-two"> <div class="f-left">肖像授权</div> <div class="f-right">'+price+'</div> </div>';
                    quan=true;
                }
                if(quan){
                    table_dom += '<div class="blue-bg">权益配合</div><div class="table-con table-two"> <div class="f-left">配合权益</div> <div class="f-right">价格</div></div>';
                }

                table_dom += quanyi_dom;
                if(quan || table){
                    table_dom = '<h1 style="margin:47px auto 15px;">艺人代言信息</h1>'+table_dom;
                }
                $('.star-table').html(table_dom);

                //显示统计图
                var tongji=false;
                if(callBack.index_date){
                    tongji=true;
                    initChartsLine(callBack.index_date,callBack.index_num);
                }
                if(callBack.age){
                    tongji=true;
                    initChartsBar(callBack.age,callBack.age_num);
                }
                if(callBack.male_num){
                    tongji=true;
                    initChartsSex(callBack.male_num, callBack.female_num);
                }
                if(callBack.provinces){
                    tongji=true;
                    initChartsPosition(callBack.provinces, callBack.province_num);
                }

                if(!tongji){
                    $('.tongji-plugin').addClass('hidden');
                }else{
                    $('.tongji-plugin').removeClass('hidden');
                }

                $('.star-con').removeClass('hidden');
                $('.no-reault').addClass('hidden');


            }

        }
    })
}

$(function () {

    var star_name = getUrlString('star_name');
    if(star_name!=''){
        getStarInfo(star_name);
    }else{
        showTip('请输入搜索内容')
    }

    //点击搜索
    $('.star-btn').on('click',function () {
        var star_name = $.trim($('input').val());
        if(star_name!=''){
            getStarInfo(star_name);
        }else{
            showTip('请输入搜索内容')
        }
    })

    $('input').on('keydown',function(event){
        if(event.keyCode == "13") {
            var star_name =$.trim($(this).val());
            if(star_name!=''){
                getStarInfo(star_name);
            }else{
                showTip('请输入搜索内容')
            }
        }
    });

    var top = $('.go-top');
    window.onscroll = function() {
        if($(window).scrollTop() >= 800){
            top.addClass('show');
        }else{
            top.removeClass('show');
        }
    };

    $('body').on('click','.go-top',function () {
        $("html,body").animate({
            scrollTop: 0
        });
    })
    /*initChartsLine(callBack.index_date,callBack.index_num);
     initChartsBar(callBack.age,callBack.age_num);
     initChartsSex(callBack.male_num, callBack.female_num);
     initChartsPosition(callBack.provinces, callBack.province_num);*/


})
