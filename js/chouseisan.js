//============================================
// ぐるなびのAPIを利用するためにkeyが必要です！
//........................
var your_gurunavi_key;
//============================================

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDHZWRbQRbWRsT2X_XUhSYH9SRx97fx4-A",
    authDomain: "dev18-chat-8fd12.firebaseapp.com",
    databaseURL: "https://dev18-chat-8fd12.firebaseio.com",
    projectId: "dev18-chat-8fd12",
    storageBucket: "dev18-chat-8fd12.appspot.com",
    messagingSenderId: "1060488773705",
    appId: "1:1060488773705:web:e47e4c7561d70ab1167f98"
};
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db_events = firebase.database().ref("db_events");
const db_answers = firebase.database().ref("db_answers");

/* DB Room ==================================
・幹事が主催するイベント情報： db_events
・ユーザー購買情報： db_answers
==============================================*/


//===========================
// Utility
//===========================
// エスケープ文字置換用
function escapeSelectorString(val){
    return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
  }
/**
 * 二次元配列または連想配列の並び替え
 * @param {*[]} array 並び替える配列
 * @param {'ASC'|'DESC'} [order] 並び替える方法
 * @param {...*} args 並び替えの基準となるキー
 * @return {*[]} 並び替えられた配列
 */
var sortBy = function(array, order) {
    if (!order || !order.match(/^(ASC|DESC)$/i)) order = 'ASC';
    order = order.toUpperCase();
 
    var keys = [];
    for (var i = 2, len = arguments.length; i < len; i++) keys.push(arguments[i]);
 
    var targets = [].concat(array);
 
    targets.sort(function(a, b) {
        for (var i = 0, len = keys.length; i < len; i++) {
            if (typeof keys[i] === 'string') {
                if (order === 'ASC') {
                    if (a[keys[i]] < b[keys[i]]) return -1;
                    if (a[keys[i]] > b[keys[i]]) return 1;
                } else {
                    if (a[keys[i]] > b[keys[i]]) return -1;
                    if (a[keys[i]] < b[keys[i]]) return 1;
                }
            } else {
                var localOrder = keys[i].order || 'ASC';
                if (!localOrder.match(/^(ASC|DESC)$/i)) order = 'ASC';
                order = order.toUpperCase();
 
                if (localOrder === 'ASC') {
                    if (a[keys[i].key] < b[keys[i].key]) return -1;
                    if (a[keys[i].key] > b[keys[i].key]) return 1;
                } else {
                    if (a[keys[i].key] > b[keys[i].key]) return -1;
                    if (a[keys[i].key] < b[keys[i].key]) return 1;
                }
            }
        }
        return 0;
    });
    return targets;
};

//---------------------------------------
//  イベントクラス
//---------------------------------------
const eventClass = class {
    constructor() { /* コンストラクタ */
      this.event_name = "";
      this.event_detail = "";
      this.event_producer = "";
      this.candidates = []; //jsonの配列
    }
    set_eventSettings( event_name, event_detail, producer ){
        this.event_name = event_name;
        this.event_detail = event_detail;
        this.event_producer = producer;
    }
    set_CandiDates( candi_date, candi_timezone ){  /* メソッド */
        this.candidates.push(
            {candi_date: candi_date
            , candi_time: candi_timezone}
            );
        var sorted_candidates = sortBy(this.candidates, 'ASC', 0, 1);
        this.candidates = sorted_candidates;
    }
    get_CandiDates(){
        return( this.candidates );
    }
    get_allInfo(){
        var message = "イベント名：" + this.event_name;
        message += "| 説明：" + this.event_detail;
        message += "| 主催者：" + this.event_producer;
        message += "| 候補日時：" ;

        for( i=0; i< this.candidates.length; i++){
            message += "{" + this.candidates[i]["candi_date"] + ", " + this.candidates[i]["candi_timezone"] + "}" ;
        }
        return( message );
    }
    get_Jsonized(){
        var jsonized = {
            event_name : this.event_name,
            event_detail : this.event_detail,
            event_producer : this.event_producer,
            candidates : this.candidates
          };
        return( JSON.stringify(jsonized) );
    }
  }
//---------------------------------------
// イベント作成クリックイベント
//---------------------------------------
$("#btn_newEvent").on("click", function () {
    new_event = new eventClass(null);
    $("#sec_event_setting").css("visibility","visible");
    $("#btn_newEvent").attr({"disabled":"true"});
});

//---------------------------------------
// Save クリックイベント
//---------------------------------------
$("#btn_save").on("click", function () {

var event_name = $('#name_event').val();
var event_detail = $('#memo_event_detail').val();
var event_producer = $('#name_producer').val();
new_event.set_eventSettings(event_name, event_detail, event_producer);

// 入力フォーム候補日時表の行列数をカウント
// 候補をクラスに格納
//行数取得
var num_candids = tbl_candidate_dates.rows.length - 1;
console.log("候補数： " + num_candids);

for( i = 0; i < num_candids; i++ ){
    var tmp_date = $('input[name="候補日_'+ (i+1) +'"]').val();
    var tmp_time_zone = $('select[name="候補時間_'+ (i+1) +'"]').val();
    console.log( tmp_date + ", "+ tmp_time_zone);
    new_event.set_CandiDates(tmp_date, tmp_time_zone);
}

console.log( new_event.get_allInfo() );
// データを保存する
//localStorage.setItem( event_name, new_event.get_Jsonized());
db_events.child("/"+ event_name).set({
    //開催するイベント名
    event_name: new_event.event_name,
    //イベントの説明
    event_detail: new_event.event_detail,
    //主催者名
    event_producer: new_event.event_producer,
    //実施日候補
    event_candidates: new_event.candidates
});

//イベントクラス初期化
new_event = new eventClass();
});

//---------------------------------------
// clear クリックイベント
//---------------------------------------
$("#btn_del_event").on('click', function () {
    // 保存されたデータ（localStorage）を消す
    //localStorage.clear();

    //id="list"を削除する
    $("#event_detail").empty();
});

//---------------------------------------
// ページ読み込み：保存データ取得表示
//---------------------------------------
for (let i = 0; i < localStorage.length; i++) {
    // 保存されたデータのkeyを取得
    const key = localStorage.key(i);
    console.log(key, 'key')

    // getItemのKeyを使って保存されたデータを全部取得
    const value = localStorage.getItem(key);
    console.log(value, 'value')

    const html = `<li><span>${value}</span></li>`
    $("#list").append(html);
}

/* ----------------------------------------------------
// 候補の日付を入力する際の表型フォーム
// 
// 【参考】 
//  https://www.northwind.mydns.jp/samples/table_sample1.php 
// ----------------------------------------------------

// appendRow: テーブルに行を追加 */
// 対象： <form id="frm_date"> <table id="tbl_candidate_dates">
function appendRow()
{
    var objTBL = document.getElementById("tbl_candidate_dates");
    if (!objTBL){ return; }
    
    var count = objTBL.rows.length;
    
    // 最終行に新しい行を追加
    var row = objTBL.insertRow(count);

    // 列の追加
    // 日付
    var c1 = row.insertCell(0);
    // 時間
    var c2 = row.insertCell(1);

    // 各列に表示内容を設定
    c1.innerHTML = '<input name="候補日_' + count + '" type="date" id="candi_date_' + count + '">';
    c2.innerHTML = '<select name="候補時間_' + count + '" class="candi_timezone" id="candi_timezone_' + count + '" >'
                    + '<option value="empty"></option>'
                    + '<option value="15\:00">15:00 ~ </option>'
                    + '<option value="16\:00">16:00 ~ </option>'
                    + '<option value="17\:00">17:00 ~ </option>'
                    + '<option value="18\:00">18:00 ~ </option>'
                    + '<option value="19\:00">19:00 ~ </option>'
                    + '<option value="20\:00">20:00 ~ </option>'
                    + '<option value="21\:00">21:00 ~ </option>'
                    + '</select>';
    
    // 追加した行の入力フィールドへフォーカスを設定
    var objInp = document.getElementById("txt" + count);
    if (objInp){
        objInp.focus();
    }
}

/*
 * deleteRow: 削除ボタン該当行を削除
 */
function deleteRow(obj)
{
    // 確認
    if (!confirm("この候補日時を削除しますか？")){return;}

    if (!obj){return;}

    var objTR = obj.parentNode.parentNode;
    var objTBL = objTR.parentNode;
    
    if (objTBL)
        objTBL.deleteRow(objTR.sectionRowIndex);
    
    // ↓↓↓------ここから多分いらない //
    // <span> 行番号ふり直し
    var tagElements = document.getElementsByTagName("span");
    if (!tagElements){return false;}

    var seq = 1;
    for (var i = 0; i < tagElements.length; i++)
    {
        if (tagElements[i].className.match("seqno"))
            tagElements[i].innerHTML = seq++;
    }

    // id/name ふり直し
    var tagElements = document.getElementsByTagName("input");
    if (!tagElements)
        return false;

    // <input type="text" id="txtN">
    var seq = 1;
    for (var i = 0; i < tagElements.length; i++)
    {
        if (tagElements[i].className.match("inpval"))
        {
            tagElements[i].setAttribute("id", "txt" + seq);
            tagElements[i].setAttribute("name", "txt" + seq);
            ++seq;
        }
    }
    // ここまで--------↑↑↑↑ //
}

/*
* カレンダーの使い勝手向上のための関数
*/
function formatDate(dt) {
    var y = dt.getFullYear();
    var m = ('00' + (dt.getMonth()+1)).slice(-2);
    var d = ('00' + dt.getDate()).slice(-2);
    return (y + '-' + m + '-' + d);
  }
// 今日以降の日付は選択できないようにする小細工
$('input[type="date"]').on('click', function () {
    var today = formatDate( new Date() );
    console.log( today );
    $('input[type="date"]').attr({'min': today})
});

//========================================
// 出席可否入力
//========================================

//---------------------------------------
// 入力対象の選択と候補日時表示
//---------------------------------------
var events; //dbに登録されている全イベント・オブジェクトを取得
var events_name;

db_events.once('value',function(data){
    events = data.val(); //オブジェクトを取得
    events_name = Object.keys(events);
});

$("#targ_event").on('click', function () {
    $("#targ_event").empty();
    $("#targ_event").append('<option value="empty">入力するイベントを選んでください</option>');
    
    for( i = 0; i < events_name.length; i++ ){
        var event_name = events_name[i];
        //選択リスト: id="targ_event" に追加
        $("#targ_event").append('<option value="'+ event_name +'">'+ event_name + '</option>');
    }
});

var targ_candidates;
let select = document.querySelector('[id="targ_event"]');
select.onchange = event => { 
    $("#tbl_ans").empty();
    $("#tbl_ans").append('<tr><th>日付</th><th>時間帯</th></tr>');
    var name_attendee = $('#name_attendee').val();
    var targ_event_key = $('#targ_event').val();
    var targ_event = events[targ_event_key];
    targ_candidates = targ_event["event_candidates"];

    console.log(targ_candidates);

    for( i =0; i< targ_candidates.length; i++ ){
        $("#tbl_ans").append('<tr>'
                                    + '<td>' + targ_candidates[i]["candi_date"] + '</td>'
                                    + '<td>' + targ_candidates[i]["candi_time"] + '</td></tr>');
    }
    // テーブル取得
    var table = document.getElementById("tbl_ans");

    // 行数取得
    var rows = table.rows.length;
            
    console.log( targ_candidates);
    // 各行末尾にセルを追加
    for ( var i = 0; i < rows; i++) {
        var cell = table.rows[i].insertCell(-1);
        var cols = table.rows[i].cells.length;
        if (cols > 10) {
            continue;
        }
        if( i == 0){
            cell.innerHTML = '<p>' + name_attendee + '</p>'
        }else{
            cell.innerHTML = '<select id="' + targ_candidates[i-1]["candi_date"] + "_" + targ_candidates[i-1]["candi_time"]+ '" >'
                            + '<option value="ー"></option>'
                            + '<option value="○">出席</option>'
                            + '<option value="?">不明</option>'
                            + '<option value="×">欠席</option>'
                            + '</select>';
        }
    }
}

//---------------------------------------
// 回答結果送信ボタン
//---------------------------------------
$("#btn_submit").on('click', function () {
    
    //回答対象のイベント
    var ans_targ_event = $('#targ_event').val(); 
    var ans_name = $('#name_attendee').val();

    if(( ans_name == null)||( ans_name == "undefined") ){
        alert("氏名が入力されていません！");
        return
    }

    for( i =0; i< targ_candidates.length; i++ ){

        targ_ans_date = targ_candidates[i]["candi_date"];
        targ_ans_time = escapeSelectorString( targ_candidates[i]["candi_time"] );
        

        // データを保存する
        db_answers.child("/"+ ans_targ_event 
                        + "/" + ans_name 
                        + "/" + targ_ans_date + "_" + targ_ans_time ).set({
            //出欠回答
            ans: $("#"+ targ_ans_date + "_" + targ_ans_time).val(),
            //要望
            req: $("#request").val()
        });
    }
    alert("出欠を回答しました");
});

//========================================
// 出欠確認：集計
//========================================
db_events.once('value',function(data){
    events = data.val(); //オブジェクトを取得
    events_name = Object.keys(events);
});

//集計対象イベント
var targ_agg_event;

//店を探す際の検索クエリ
var reqs;

//----------------------------
//集計対象イベントを選択するボタン
//----------------------------
$("#targ_show_result_event").on('click', function () {
    $("#targ_show_result_event").empty();
    $("#targ_show_result_event").append('<option value="empty">集計するイベントを選んでください</option>');
    
    for( i = 0; i < events_name.length; i++ ){
        var event_name = events_name[i];
        //選択リスト: id="targ_show_result_event" に追加
        $("#targ_show_result_event").append('<option value="'+ event_name +'">'+ event_name + '</option>');
    }
});

//プルダウンで対象イベントが選択されたら...
//イベント情報を取得
db_events.once('value',function(data){
    events = data.val();
    events_name = Object.keys(events);
});

//全回答結果を取得
db_answers.once('value',function(data){
    answers = data.val(); 
});

let select_show_result_event = document.querySelector('[id="targ_show_result_event"]');
select_show_result_event.onchange = event => { 

    //プルダウンで選択されたイベント
    targ_agg_event = $("#targ_show_result_event").val();
    targ_event = events[targ_agg_event];
    targ_ans = answers[targ_agg_event];

    //当該イベントの候補日時
    var targ_candidates = targ_event["event_candidates"];
    console.log(targ_candidates);

    //出欠回答者
    answers_members = Object.keys(targ_ans);
    console.log(answers_members);

    //出欠回答集計テーブルを初期化
    $("#tbl_results").empty();
    $("#tbl_results").append('<tr><th>日付</th><th>時間帯</th></tr>');

    for( i =0; i< targ_candidates.length; i++ ){
        $("#tbl_results").append('<tr>'
                                    + '<td>' + targ_candidates[i]["candi_date"] + '</td>'
                                    + '<td>' + targ_candidates[i]["candi_time"] + '</td></tr>');
    }
    // テーブル取得
    var table = document.getElementById("tbl_results");

    // 行数取得
    var rows = table.rows.length;

    // 各行末尾にセルを追加
    // j: 回答者（列）のインデックス
    // ついでに、お店のリクエスト項目：req_list = [] も作成
    var req_list = [];

    for( var j = 0; j <= Object.keys(targ_ans).length; j++ ){
        // i: 行数のインデックス、 i-1: 候補日のインデックス 
        // 回答者それぞれに対して
        if( j < Object.keys(targ_ans).length){
            for ( var i = 0; i < rows; i++) {
                var cell = table.rows[i].insertCell(-1);
                var cols = table.rows[i].cells.length;
                if (cols > 10) {
                    continue;
                }
                if( i == 0){
                    cell.innerHTML = '<p>' + Object.keys(targ_ans)[j] + '</p>'
                }else{
                    //各行に対応する日時の回答
                    targ_ans_datetime = targ_candidates[i-1]["candi_date"] + "_" + escapeSelectorString( targ_candidates[i-1]["candi_time"] );
                    cell.innerHTML = '<p>'+ targ_ans[Object.keys(targ_ans)[j]][targ_ans_datetime]["ans"] +'</p>';
                }
            }
            let tmp_req = targ_ans[Object.keys(targ_ans)[j]][targ_ans_datetime]["req"]
            req_list.push( tmp_req );
        }else{
            // 一番右には「決定」選択ボタン用の列を配置
            for ( var i = 0; i < rows; i++) {
                var cell = table.rows[i].insertCell(-1);
                var cols = table.rows[i].cells.length;
                if( i == 0){
                    cell.innerHTML = '<th class="marked_cell"><p>' + "開催日" + '</p></th>'
                }else{
                    targ_ans_datetime = targ_candidates[i-1]["candi_date"] + "_" + escapeSelectorString( targ_candidates[i-1]["candi_time"] );
                    cell.innerHTML = '<div class="marked_cell"><p><input type="radio" name=decided_date value=' + targ_ans_datetime +'></p></div>'
                }
            }
        }
    }

    req_list = Array.from(new Set(req_list));
    var reqs = req_list.join();

    //------------------
    // お店のサジェスチョン
    //----------------------------------------
    function show_suggestion(position) {

        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        console.log( reqs );
        // 現在地の近くにある店舗の検索
        // reqs: フリーワード検索に使うクエリ
        //仕様：検索ワードをUTF-8でURLエンコードすること「,」区切りで複数ワードが検索可能（１０個まで）
      $.ajax({
        type : "get",
        url : "https://api.gnavi.co.jp/RestSearchAPI/v3/"
                +"?keyid=" + your_gurunavi_key
                +"&latitude="+lat+"&longitude="+lng
                +"&range=4"
                +"&freeword="+ encodeURIComponent(reqs)
                +"&freeword_condition=2"
                +"&bottomless_cup=1"
                +"&hit_per_page=" + num_shop,
        dataType : 'json',
        success : function(json){
    
          for( let i = 0; i < num_shop; i++){
            console.log(json.rest[i].url);
            var latLng = new google.maps.LatLng(json.rest[i].latitude, json.rest[i].longitude);
            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
                label: {
                  text: String(i+1),
                  color: "#fff",
                  fontWeight: 'bold',
                  fontSize: '14px'
                },
                url: json.rest[i].url,
            });
            google.maps.event.addListener(marker, 'click', (function(url){
              return function(){ location.href = url; };
            })(json.rest[i].url));
            $('<li class="each-shop"><i class="fas fa-map-marker fa-3x"></i><span class="icon">'
                + String(i+1) + '</span><a href="' + json.rest[i].url + '">'
                +'<img class="shop-img" src=' + json.rest[i].image_url.shop_image1 + '>'
                +'<span class="shop-content"><span class="shop-name">' 
                + String(i+1) + " " + json.rest[i].name + '</span>'
                +'<span class="time">営業時間：' + json.rest[i].opentime + '</span>'
                +'</span></a></li>').appendTo('#shop-list');
          }
        },
        error: function(json){
          console.log("error")
        }
      });
    
      var marker = new google.maps.Marker({
          position: new google.maps.LatLng( lat, lng ),
          map: map
      });
      map.setCenter( new google.maps.LatLng( lat, lng ) );
    };
    // 現在地を取得して地図に表示する
    let a = navigator.geolocation.getCurrentPosition(show_suggestion);

}

//================================
// お店のサジェスチョン
//================================
var num_shop = 5;

// 地図を表示する
var map;
geocoder = new google.maps.Geocoder();
var mapOptions = {
    zoom: 15
}
map = new google.maps.Map(document.getElementById("map"), mapOptions);
