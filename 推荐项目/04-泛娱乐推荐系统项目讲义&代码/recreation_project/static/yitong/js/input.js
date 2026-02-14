/**
 * Created by Villen on 18/7/10.
 */

$(function () {

    //编辑作品
    $('body').on('click','.J_edit',function () {
        var _this = $(this),
            _parent = _this.closest('tr');
        _parent.addClass('currentTr');
        $('.J_sure').attr('data-type','edit');



        var work0 = _parent.find('td[data-name=work0]'),
            work2 = _parent.find('td[data-name=work2]'),
            work3 = _parent.find('td[data-name=work3]'),
            work4 = _parent.find('td[data-name=work4]'),
            work5 = _parent.find('td[data-name=work5]'),
            work6 = _parent.find('td[data-name=work6]'),
            work7 = _parent.find('td[data-name=work7]')

        $('.starEdit').modal().on('shown.bs.modal',function () {
            if($('.J_sure').attr('data-type')=='edit'){
                $('#work0').val(work0.text())
                $('#work3').val(work3.text())
                $('#work4').val(work4.text())
                $('#work7').val(work7.text())
                var op = $('#work2 option'),
                    opl= op.length,
                    va = work2.text()
                for(var i=0; i<opl; i++){
                    if(op.eq(i).val()==va){
                        op.eq(i).attr('selected','selected');
                    }
                }
                var op2 = $('#work5 option'),
                    opl2 = op2.length,
                    va2 = work5.text()
                for(var i=0; i<opl2; i++){
                    if(op2.eq(i).val()==va2){
                        op2.eq(i).attr('selected','selected');
                    }
                }

                var actor_txt = work3.text();
                var actors = actor_txt.split('、');
                if (actors != '') {
                    $("#actors").html('');
                    for (var i = 0; i < actors.length; i++) {
                        if (actors[i] != '') {
                            var txt = '<span class="btn btn-info actor_tag">';
                                txt += '<input type="hidden" class="actor_input_tag" value="'+actors[i]+'">';
                                txt += actors[i];
                                txt += '<i class="glyphicon glyphicon-remove" onclick="removeBrand(this)"></i>';
                                txt += '</span>';
                            $("#actors").append(txt);
                        }
                    }
                }

                var broad_plat_txt = work6.text();
                var broad_plat = broad_plat_txt.split('、');
                if (broad_plat != '') {
                    $("#broad_plat").html('');
                    for (var i = 0; i < broad_plat.length; i++) {
                        if (broad_plat[i] != '') {
                            var txt = '<span class="btn btn-info plat_tag">';
                                txt += '<input type="hidden" class="broad_plat_tag" value="'+broad_plat[i]+'">';
                                txt += broad_plat[i];
                                txt += '<i class="glyphicon glyphicon-remove" onclick="removeBrand(this)"></i>';
                                txt += '</span>';
                            $("#broad_plat").append(txt);
                        }
                    }
                }
            }

        }).on('hidden.bs.modal',function () {
            $('.currentTr').removeClass('currentTr');
        });

    })
    $('body').on('click','.J_del',function (){
        if(confirm('确定删除吗')){
            $(this).closest('tr').remove();
        }
    })
    //增加作品
    $('body').on('click','.J_add',function () {
        $('.J_sure').attr('data-type','add');
        $('.starEdit').modal().on('show.bs.modal',function () {
        }).on('hidden.bs.modal',function () {
        });
    })

    $('.J_stop').on('click',function () {
        var r=confirm("确定要取消操作吗？")
        if (r==true) {
            clearForm();
            $('.starEdit').modal('hide');
        }
    })
    $('.J_sure').on('click',function () {
        if($.trim($('#work0').val())==''){
            showTip('作品名称必填');

        }else if($('.modal-star .red').length>0){
            showTip('合作演员错误');
        }else{

            var broad_plat = $(".broad_plat_tag"),
                snum = broad_plat.length,
                broad_plat_txt = '';
            for (var i = 0; i < snum; i++) {
                var _this = broad_plat.eq(i);
                broad_plat_txt = broad_plat_txt + _this.val() + '、';
            }
            broad_plat_txt = broad_plat_txt.substring(0, broad_plat_txt.length-1);
            $("#work6").val(broad_plat_txt);

            var actor = $(".actor_input_tag"),
                snum = actor.length,
                actor_txt = '';
            for (var i = 0; i < snum; i++) {
                var _this = actor.eq(i);
                actor_txt = actor_txt + _this.val() + '、';
            }
            actor_txt = actor_txt.substring(0, actor_txt.length-1);
            $("#work3").val(actor_txt);

            if($(this).attr('data-type')=='edit'){
                var mytime=$('.currentTr td[data-name=work1]').text(),
                    trDom = '<td data-name="work0">'+$('#work0').val()+'</td> <td data-name="work1">'+mytime+'</td> <td data-name="work2" class="hidden">'+$('#work2').val()+'</td> <td data-name="work3" class="hidden">'+$('#work3').val()+'</td></td> <td data-name="work4" class="hidden">'+$('#work4').val()+'</td></td> <td data-name="work5" class="hidden">'+$('#work5').val()+'</td></td> <td data-name="work6" class="hidden">'+$('#work6').val()+'</td> <td data-name="work7" class="hidden">'+$('#work7').val()+'</td><td class="more"><span class="star-edit J_edit">编辑</span> <span class="star-del J_del">删除</span></td>';
                $('.currentTr').html(trDom);

            }else{
                var myDate = new Date(),
                    mytime=myDate.getFullYear()+'.'+(myDate.getMonth()+1)+'.'+myDate.getDate(),
                    trDom = '<tr> <td data-name="work0">'+$('#work0').val()+'</td> <td data-name="work1">'+mytime+'</td> <td data-name="work2" class="hidden">'+$('#work2').val()+'</td> <td data-name="work3" class="hidden">'+$('#work3').val()+'</td></td> <td data-name="work4" class="hidden">'+$('#work4').val()+'</td></td> <td data-name="work5" class="hidden">'+$('#work5').val()+'</td></td> <td data-name="work6" class="hidden">'+$('#work6').val()+'</td> <td data-name="work7" class="hidden">'+$('#work7').val()+'</td><td class="more"><span class="star-edit J_edit">编辑</span> <span class="star-del J_del">删除</span></td> </tr>';
                $('tbody').append(trDom);
            }
            clearForm();
            $("#star_works").show();
            $('.starEdit').modal('hide');
        }
    })
    /*提交数据*/
    $('.J_upload').on('click',function () {
        var inputs = $('.star-from .form-control'),
            num = inputs.length,
            inputs_string='{';
        for(var p=0; p<num; p++){
            var _this = inputs.eq(p);
            if(_this.attr('name') && _this.val()!=''){
                var val =$.trim(_this.val()),
                    value = _this.attr('type')!='number' ? '"'+val+'"' :  val;
                inputs_string += '"'+_this.attr('name')+'":'+ value +',';
            }
        }
        if($('.red').length==0){

        /*radio的数据*/
        var inputs = $('.star-from input[type=radio]:checked'),
            num = inputs.length;
        for(var p=0; p<num; p++){
            var _this = inputs.eq(p);
            if(_this.attr('name') && _this.val()!=''){
                inputs_string += '"'+_this.attr('name')+'":'+ _this.val()+',';
            }
        }
        /*table的表格数据*/
        var inputs = $('tbody tr'),
            num = inputs.length,
            table_str='"works":[';
        for(var p=0; p<num; p++){
            var _this = inputs.eq(p),
                _td = _this.find('td');
            inputs_string += '"work'+p+'":[';
            table_str += '"work'+p+'"';
            for(var i=0; i<8; i++){
                inputs_string += '"'+_td.eq(i).text()+'"';
                if(i<7){
                    inputs_string += ',';
                }
            }
            inputs_string += '],';
            if(p!=num-1){
                table_str += ',';
            }
        }
        table_str += ']';


        var star_brand = $(".star_brand"),
            snum = star_brand.length,
            brand_txt = '';
        for (var i = 0; i < snum; i++) {
            var _this = star_brand.eq(i);
            brand_txt = brand_txt + '"' + _this.val() + '",';
        }
        brand_txt = brand_txt.substring(0, brand_txt.length-1);
        brand_txt = ',"brand":[' + brand_txt + ']'

        inputs_string += table_str;
        inputs_string += brand_txt;
        inputs_string += '}';
        // console.log(inputs_string)
        // return false;
        $.ajax({
            type:'POST',
            url:GlobalParam.apiHost+'/yt_update_star',
            data:{
                "data":inputs_string
            },
            //data:{"data": "{"+formData+"}"},
            dataType:'json',
            success:function (data) {
                if(data.msg=='OK'){
                    showTip('提交成功');
                    setTimeout(function () {
                        window.location.href='http://39.106.254.132:8087/yitong_starEyes/';
                    },1200)
                }
            }
        })
        }else{
            showTip('请查看表单错误');
        }
    })

    /*编辑获取信息*/
    var star_name = getUrlString('id');
    if(star_name!=''){
        $.ajax({
            type:'GET',
            url:GlobalParam.apiHost+'/search_star/?star_name='+star_name,
            dataType:'json',
            success:function (data) {
                console.log(data)
                if(data.name){
                    var inputs = $('.star-from input'),
                        num = inputs.length;
                    for(var p=0; p<num; p++){
                        var _this = inputs.eq(p);
                        if(_this.attr('type')=='radio'){
                            var nn = _this.attr('name');
                            if(data[nn]==_this.val()){
                                _this.attr('checked','checked');
                                if(data[nn]==0){
                                    _this.parent().find('.form-section').addClass('unvisible')
                                }else{
                                    _this.parent().find('.form-section').removeClass('unvisible')
                                }
                            }

                        }else{
                            var nn = _this.attr('name');
                            _this.val(data[nn]);
                        }
                        $('textarea').val(data.ps);
                    }
                    var trDom='';
                    if(data.works){
                        data.works.forEach(function (item) {
                            var tr = data[item];
                            var work4 = tr[4] ? tr[4] : '';
                            var work5 = tr[5] ? tr[5] : '';
                            var work6 = tr[6] ? tr[6] : '';
                            var work7 = tr[7] ? tr[7] : '';
                            trDom +='<tr> <td data-name="work0">'+tr[0]+'</td> <td data-name="work1">'+tr[1]+'</td> <td data-name="work2" class="hidden">'+tr[2]+'</td> <td data-name="work3" class="hidden">'+tr[3]+'</td><td data-name="work4" class="hidden">'+work4+'</td><td data-name="work5" class="hidden">'+work5+'</td><td data-name="work6" class="hidden">'+work6+'</td> <td data-name="work7" class="hidden">'+work7+'</td><td class="more"><span class="star-edit J_edit">编辑</span> <span class="star-del J_del">删除</span></td> </tr>';
                        })
                    } else {
                        $("#star_works").hide();
                    }
                    $('tbody').html(trDom);
                    $('.star-from').addClass('show');
                }
                if (data.brand) {
                    var brand_list = data.brand;
                    if (brand_list != '') {
                        $("#brand_tags").html('');
                        for (var i = 0; i < brand_list.length; i++) {
                            if (brand_list[i] != '') {
                                var txt = '<span class="btn btn-info brand_tag">';
                                    txt += '<input type="hidden" class="star_brand" value="'+brand_list[i]+'">';
                                    txt += brand_list[i];
                                    txt += '<i class="glyphicon glyphicon-remove" onclick="removeBrand(this)"></i>';
                                    txt += '</span>';
                                $("#brand_tags").append(txt);
                            }
                        }
                    }
                }
            }
        })
    }else{
        $('.star-from').addClass('show');
    }

    $('.form-section').on('change','.form-money',function () {
        var _this = $(this),
            _money = _this.parent().find('.form-money');
        var val0=_money.eq(0).val(),
            val1=_money.eq(1).val();
        val0 = parseInt(val0);
        val1 = parseInt(val1);
        console.log(val0);
        console.log(val1);
        if(val0 > 0 && val1 > 0 && val0 > val1){
            showTip('请注意区间范围的正确性！');
            _this.val('');
        }else{
            _money.eq(0).val((val0));
            _money.eq(1).val((val1));
        }
    })
    /*radio*/
    $('body').on('change','input[type=radio]',function () {
        var _this=$(this);
        if(_this.val()==0){
            _this.parent().find('.form-section').addClass('unvisible');
        }else{
            _this.parent().find('.form-section').removeClass('unvisible');
        }
    })
    /*$('input[name=phone]').on('change',function () {
        if(!(/^1(3|4|5|7|8)\d{9}$/.test($(this).val()))){
            showTip('电话格式错误');
            $(this).addClass('red');
        }else{
            $(this).removeClass('red');
        }
    })*/
    $('input[name=phone]').on('change',function () {
        if($(this).val().length>11){
            showTip('电话不超过11个字');
            $(this).addClass('red');
        }else{
            $(this).removeClass('red');
        }
    })
    $('input[name=brand]').on('change',function () {
        var _this=$(this)
        errorTip(_this,/^[\u4e00-\u9fa5|、|a-z|A-Z\\w]+$/,'仅支持中英文和顿号');
    })
    $('input[name=name]').on('change',function () {
        var _this=$(this);
        if($.trim(_this.val()).length<2){
            _this.addClass('red');
            showTip('姓名不要少于2个字');
        }else{
            _this.removeClass('red');
        }

    })
    $('input[name=borthday]').on('change',function () {
        var _this=$(this);
        errorTip(_this,/^[-|0-9\\w]+$/,'生日格式错误');

    })
    $('#work3').on('change',function () {
        var _this=$(this);
        errorTip(_this,/^[\u4e00-\u9fa5|、|a-z|A-Z\\w]+$/,'仅支持中英文和顿号');
        if(_this.val().split('、').length>5){
            showTip('不能超过5个')
            _this.addClass('red');
        }

    })
    $('input[name=name2]').on('change',function () {
        var _this=$(this);
        errorTip(_this,/^[a-z|A-Z\\w]+$/,'只能输入英文');
    })

    $("#add_brand").click(function() {
        $("#brand_input").show()
        $("#add_brand").hide()
    })

    $("#brand_input").blur(function() {
        $("#brand_input").hide();
        $("#add_brand").show();
    })

    $('#brand_input').bind('keyup',function(event) {
        if (event.keyCode == 13) {
            addBrand();
        }
    })

    $("#add_broad_plat").click(function() {
        $("#broad_plat_input").show()
        $("#add_broad_plat").hide()
    })

    $("#broad_plat_input").blur(function() {
        $("#broad_plat_input").hide();
        $("#add_broad_plat").show();
    })

    $("#broad_plat_input").bind('keyup',function(event) {
        if (event.keyCode == 13) {
            addBroad()
        }
    })

    $("#add_actor").click(function() {
        $("#actor_input").show()
        $("#add_actor").hide()
    })

    $("#actor_input").blur(function() {
        $("#actor_input").hide();
        $("#add_actor").show();
    })

    $("#actor_input").bind('keyup',function(event) {
        if (event.keyCode == 13) {
            addActor()
        }
    })

})

function addBroad() {
    var plat = $("#broad_plat_input").val();
    if (plat != '') {
        var txt = '<span class="btn btn-info plat_tag">';
            txt += '<input type="hidden" class="broad_plat_tag" value="'+plat+'">';
            txt += plat;
            txt += '<i class="glyphicon glyphicon-remove" onclick="removeBrand(this)"></i>';
            txt += '</span>';
        $("#broad_plat").append(txt);
        $("#broad_plat_input").val('');
        $("#broad_plat_input").hide();
        $("#add_broad_plat").show();
    }
}

function addActor() {
    var actor = $("#actor_input").val();
    if (actor != '') {
        var txt = '<span class="btn btn-info actor_tag">';
            txt += '<input type="hidden" class="actor_input_tag" value="'+actor+'">';
            txt += actor;
            txt += '<i class="glyphicon glyphicon-remove" onclick="removeBrand(this)"></i>';
            txt += '</span>';
        $("#actors").append(txt);
        $("#actor_input").val('');
        $("#actor_input").hide();
        $("#add_actor").show();
    }
}

function addBrand() {
    var brand = $("#brand_input").val();
    if (brand != '') {
        showWait();
        $.getJSON( "http://192.168.10.66:8000/detect_brand/?brand=" + brand, function( data ) {
            if (data.msg != 'Error!') {
                var txt = '<span class="btn btn-info brand_tag">';
                    txt += '<input type="hidden" class="star_brand" value="'+brand+'">';
                    txt += brand;
                    txt += '<i class="glyphicon glyphicon-remove" onclick="removeBrand(this)"></i>';
                    txt += '</span>';
                $("#brand_tags").append(txt);
                $("#brand_input").val('');
                $("#brand_input").hide();
                $("#add_brand").show();
            } else {
                showTip("该品牌未被百度收录");
            }
            hideWait();
        })
    }
}

function removeBrand(the) {
    $(the).parent().remove();
}

function formCheck() {

}
/*清除form*/
function clearForm() {
    $('.modal-star')[0].reset();
    $('.modal-star .red').removeClass('red');
}

function errorTip(_this,pre, key) {
    _this.val($.trim(_this.val()));
    var _val=_this.val();
    if(_val!='' && !(pre.test(_this.val()))){
        showTip(key);
        _this.addClass('red');
        return false;
    }else{
        _this.removeClass('red');
    }
}

