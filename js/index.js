~(function(){
    var winW=document.documentElement.clientWidth,
        desW=640,
        htmlFont=winW/desW*100;
    if(winW>=640){
        $(".musicBox").css({width:desW,margin:"0 auto"});
        window.htmlFont=100;
        return ;
    }
    window.htmlFont=htmlFont;
    document.documentElement.style.fontSize=htmlFont+"px";
})();
//main
~(function(){
    var winH=document.documentElement.clientHeight,
        headerH=$(".header")[0].offsetHeight,
        footerH=$(".footer")[0].offsetHeight;
        $(".main").css("height",winH-headerH-footerH-htmlFont*0.8)
})();
//render
var musicRender=(function(){
    var $musicPlan=$.Callbacks();
    var $current=$(".current"),
        $lyric=$(".lyric"),
        $duration=$(".duration"),
        $timeLineSpan=$(".timeLine>span");
    var musicAudio=$("#musicAudio")[0];
    var $musicBtn=$(".musicBtn"),
        //获取集合中的某一个，结果依然是JQ对象;
        $musicBtnPlay=$musicBtn.eq(0),
        $musicBtnPause=$musicBtn.eq(1);
    var musicTimer=null,
        step=0;//记录当前展示到那句话
    function formatTime(second){
        var minute=Math.floor(second/60);
        second=Math.floor(second-minute*60);
        minute < 10 ? minute="0"+minute:null;
        second < 10 ? second="0"+second:null;
        return minute+":"+second;
    }
    //数据绑定
    $musicPlan.add(function(data){
        var str="";
       $.each(data,function(index,item){
           str+="<p id='lyric"+item.id+"' data-minute='"+item.minute+"' data-second='"+item.second+"'>"+item.content+"</p>";
       });
        $lyric.html(str);
    });
    //控制音频的播放
    $musicPlan.add(function(){
        musicAudio.play();
        //保证音频先加载，在显示
        musicAudio.addEventListener("canplay",function(){
            $duration.html(formatTime(musicAudio.duration))
            $musicBtnPlay.css("display","none");
            $musicBtnPause.css("display","block");
        })
    });
    //控制按钮  播放暂停
    $musicPlan.add(function(){
        //移动端可以使用click事件,但是代表单击操作.所以都会等待300ms ，才能判断是否为单击
        $musicBtn.tap(function(){
            //为true是暂停
            if(musicAudio.paused){
                musicAudio.play();
                $musicBtnPlay.css("display","none");
                $musicBtnPause.css("display","block");
                return ;
            }
            musicAudio.pause();
            $musicBtnPlay.css("display","block");
            $musicBtnPause.css("display","none");
        });
    });

    //追踪播放状态
    $musicPlan.add(function(){
        musicTimer=window.setInterval(function(){
            if(musicAudio.currentTime>=musicAudio.duration){
                //播放完成
                window.clearInterval(musicTimer);
            }
            //获取当前已经播放的时间
            var timeR=formatTime(musicAudio.currentTime),
                minute=timeR.split(":")[0],
                second=timeR.split(":")[1];
            $current.html(timeR);
            var width=musicAudio.currentTime/musicAudio.duration*100+"%";
            $timeLineSpan.css("width",width);
            //控制歌词
            var $lyricList=$lyric.children("p"),
                $tar=$lyricList.filter('[data-minute="'+minute+'"]').filter('[data-second="'+second+'"]');
            $tar.addClass("bg").siblings().removeClass("bg");
            var n=$tar.index();
            if(n>=3){
                //开始向上移动   0.84rem
                $lyric.css({top:-.84*(n-2)+"rem"});
            }
        },1000);
    });
    return {
        init:function(){
            $.ajax({
                url:"lyric.json",
                type:"get",
                dataType:"json",
                cache:false,
                success(result){
                    if(result&&result.code==0){
                        result=result.lyric||"";
                        //解析数据  替换内容中的特殊字符
                        result=result.replace(/&#(\d+);/g,function(){
                            var num=Number(arguments[1]),
                                val=arguments[0];
                            switch (num){
                                case 32:
                                    val=" ";
                                    break;
                                case 40:
                                    val="(";
                                    break;
                                case 41:
                                    val=")";
                                    break;
                                case 45:
                                    val="-";
                                    break;
                            }
                            return val;
                        });
                        // 捕获需要的数据
                        var data=[],
                            reg=/\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#]+)(?:&#10;)?/g,
                            index=0;
                        result.replace(reg,function(){
                            data.push({
                                id:++index,
                                minute:arguments[1],
                                second:arguments[2],
                                content:arguments[3]
                            })
                        });
                        $musicPlan.fire(data);
                    }
                }
            })
        }
    }
})();
musicRender.init();