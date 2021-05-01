const express = require('express');
const app = express();
//const logger = require('morgan');
const body_parser = require('body-parser');
const http = require('http');
//user custom modules
const redeem = require('./redeem.js');
//const gss = require('./gss.js');
const db = require('./db.js');
const gss_v4 = require('./gss_v4.js');
const th_calc = require('./title_holder_calc.js');

const api_router = express.Router();
//var hidden_members;

let is_gss_run = false;
let is_db_run = true;

const ADMIN_KEY = process.env.LPKAKAOPLUS_ADMIN_KEY;

const h2_server_list = { 1 : '플레이볼',
                        2 : '페넌트레이스',
                        3 : '플레이오프',
                        4 : '코리안시리즈',
                        5 : '클래식',
                        6 : '위너스',
                        7 : '그랜드슬램',
                        9 : '명예의전당',
                        10 : '퍼펙트게임'}; 

setInterval(function() {
    http.get("http://lpkakaoplus.herokuapp.com/");
}, 300000); // every 5 minutes (300000) heartbeat..

//google spread-sheet test code.
// gss.run(function(err){

//     if(err){
//         console.log('boot-step1. <fail> run lpkakaoplus-gss fail! code : ' + err);
//         is_gss_run = false;
//         return;
//     }

//     is_gss_run = true;
//     console.log('boot-step1. <success> run lpkakaoplus-gss success!');
// });

db.run(process.env.MONGODB_URI, function(err){

    if(err){
        console.log('boot-step2. <fail> db connection error!');
        is_db_run = false;
    }else{
        console.log('boot-step2. db connection success!');
        is_db_run = true;
    }
});

gss_v4.run(function(err){
    
    if(err != undefined){
        console.log('boot-step1. run gss_v4 failed - code : ' + err);
        return;
    }

    gss_v4.get_spc_sheet(function(err){
        
        if(err){
            console.log('boot-step1-1. run gss_v4 failed - get spc sheet from google server');
            console.log(err);
            is_gss_run = false;
            return;
        }

        gss_v4.get_hof_sheet(function(err){

            if(err){
                console.log('boot-step1-1. run gss_v4 failed - get hof sheet from google server');
                console.log(err);
                is_gss_run = false;
                return;
            }

            gss_v4.get_gamble_th_box_sheet(function(err){

                if(err){
                    console.log('boot-step1-1. run gss_v4 failed - get gamble title holder sheet from google server');
                    console.log(err);
                    is_gss_run = false;
                    return;
                }

                gss_v4.get_gamble_lucky_box_sheet(function(err){

                    if(err){
                        console.log('boot-step1-1. run gss_v4 failed - get gamble lucky box sheet from google server');
                        console.log(err);
                        is_gss_run = false;
                        return;
                    }
                    
                    gss_v4.get_gamble_th_scout_box_sheet(function(err){

                        if(err){
                            console.log('boot-step1-1. run gss_v4 failed - get gamble title holder scout sheet from google server');
                            console.log(err);
                            is_gss_run = false;
                            return;
                        }
    
                        is_gss_run = true;
                        console.log('boot-step1. <success> run lpkakaoplus-gss_v4 success!');
                    });
                });
            });
        });
    });
});

//app.use(logger('dev', {}));
app.use(body_parser.json());
app.use('/api', api_router);

app.get('/', function (req, res) {
    res.send('lpkakaoplus api server');
});

//api for admin
api_router.post('/addguild', function (req, res) {

    if(!is_db_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;       
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var admin_key = req.body.action.params.admin_key;
    var auth_key = req.body.action.params.auth_key;

    if(guild_name == null || server_num == null || auth_key == null){
        res_to_kakao_server(res, "client information is incorrect");
        return;        
    }

    if(admin_key != ADMIN_KEY){
        res_to_kakao_server(res, "incorret admin key");
        return;
    }

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length !=0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 이미 등록된 이사회 입니다.');
            return;
        }
        
        db.add_guild(guild_name, server_num, auth_key, function(err, add_guild_obj){

            if(err == db.db_err().INVALID){
                res_to_kakao_server(res, '이사회<' + add_guild_obj.name + '>를 추가하는 과정에서 알 수 없는 오류가 발생했습니다.');
                return;
            }else if(err == db.db_err().NOT_RUN){
                res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
                return;
            }

            console.log('new guild<' + add_guild_obj.name + '> is created.')
            res_to_kakao_server(res, '이사회<' + add_guild_obj.name + '>를 성공적으로 등록했습니다.');
        });
    });
});

//api for admin
api_router.post('/removeguild', function (req, res) {

    if(!is_db_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;       
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var admin_key = req.body.action.params.admin_key;

    if(guild_name == null || server_num == null || admin_key == null){
        res_to_kakao_server(res, "client information is incorrect");
        return;        
    }

    if(admin_key != ADMIN_KEY){
        res_to_kakao_server(res, "incorret admin key");
        return;
    }

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length == 0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 등록된 이사회가 아닙니다. 등록을 위해선 관리자에게 문의하세요.');
            return;          
        }
        
        db.remove_guild(result_guild_objs[0], function(err, remove_guild_obj){

            if(err == db.db_err().INVALID){
                res_to_kakao_server(res, '이사회<' + remove_guild_obj.name + '>를 제거하는 과정에서 알 수 없는 오류가 발생했습니다.');
                return;
            }else if(err == db.db_err().NOT_RUN){
                res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
                return;
            }

            console.log('guild<' + remove_guild_obj.name + '> is removed.')
            res_to_kakao_server(res, '이사회<' + remove_guild_obj.name + '>를 성공적으로 제거했습니다.');
        });
    });
});

api_router.post('/changeguildauthkey', function (req, res) {

    if(!is_db_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;       
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var auth_key = req.body.action.params.auth_key; // change for
    var admin_key = req.body.action.params.admin_key;

    if(guild_name == undefined || server_num == undefined || auth_key == undefined || admin_key == undefined){
        res_to_kakao_server(res, "client information is incorrect");
        return;        
    }

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length == 0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 등록된 이사회가 아닙니다. 등록을 위해선 관리자에게 문의하세요.');
            return;          
        }

        db.change_guild_auth_key(result_guild_objs[0], auth_key, function(err, guild_ojb){

            if(err == db.db_err().INVALID){
                res_to_kakao_server(res, '이사회<' + guild_ojb.name + '>의 인증키를 변경하는 과정에서 알 수 없는 오류가 발생했습니다.');
                return;
            }else if(err == db.db_err().NOT_RUN){
                res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
                return;
            }

            console.log('guild<' + guild_ojb.name + '> auth_key is changed : ' + auth_key);
            res_to_kakao_server(res, '이사회<' + guild_ojb.name + '>의 인증 코드를 ' + auth_key + '로 성공적으로 변경했습니다.');            
        });
    });
});

api_router.post('/getguildmember', function (req, res) {

    if(!is_db_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;       
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var auth_key = req.body.action.params.auth_key;

    if(guild_name == null || server_num == null || auth_key == null){
        res_to_kakao_server(res, "client information is incorrect");
        return;        
    }

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length == 0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 등록된 이사회가 아닙니다. 등록을 위해선 관리자에게 문의하세요.');
            return;          
        }

        if(result_guild_objs[0].auth_key != auth_key){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '> 인증키 값이 올바르지 않습니다.');
            return;
        }

        var kakao_res_str = "";
        kakao_res_str += result_guild_objs[0].name + '<' + h2_server_list[result_guild_objs[0].server] + '> 이사회원 명단(' + result_guild_objs[0].members.length + '명)\n';

        for(var i = 0; i < result_guild_objs[0].members.length; i++){
            kakao_res_str += result_guild_objs[0].members[i].name + '\n';
        }

        res_to_kakao_server(res, kakao_res_str);
        
    });
});

api_router.post('/addguildmember', function (req, res) {

    if(!is_db_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;       
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var auth_key = req.body.action.params.auth_key;
    var char_list = req.body.action.params.char_list;
    
    if(guild_name == null || server_num == null || auth_key == null || char_list == null){
        res_to_kakao_server(res, "client information is incorrect");
        return;        
    }

    char_list = Array.from(new Set(char_list.split('\n'))); // removal duplication.

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length == 0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 등록된 이사회가 아닙니다. 등록을 위해선 관리자에게 문의하세요.');
            return;          
        }

        if(result_guild_objs[0].auth_key != auth_key){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>에 구단주를 추가하기 위한 인증키 값이 올바르지 않습니다.');
            return;
        }

        //test log
        //console.log(result_guild_objs[0].members);

        if(char_list.length + result_guild_objs[0].members.length > 30){
            res_to_kakao_server(res, '현재 이사회<' + find_guild_obj.name + '>에 구단주를 추가할 경우 30명을 초과합니다.\n' + 
            '현재 (' + result_guild_objs[0].members.length +')명의 회원이 있습니다.\n' +
            '이사회원이 아닌 회원을 우선 제거하세요.');
            return;
        }

        var add_complete = 0;
        var kakao_res_str = "";

        //TODO : member duplication check;
        for(var i = 0; i < char_list.length; i++){

            db.add_guild_member(result_guild_objs[0], guild_name, server_num, char_list[i], function(err, add_member_obj, is_added){

                if(err){
                    kakao_res_str += '!! ' + add_member_obj.name + '(님) 추가 실패 (알 수 없는 오류)';
                }else if(!is_added){
                    kakao_res_str += '!! ' + add_member_obj.name + '(님) 추가 실패 (해당 구단주는 이미 회원인 것 같습니다.)';
                }
                else{
                    kakao_res_str += add_member_obj.name + '(님) 추가 성공';
                }

                add_complete++;

                if(add_complete == char_list.length){
                    res_to_kakao_server(res, kakao_res_str);
                }else{
                    kakao_res_str += '\n';
                }
            });
        }
    });
});

api_router.post('/removeguildmember', function (req, res) {

    if(!is_db_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;       
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var auth_key = req.body.action.params.auth_key;
    var char_list = req.body.action.params.char_list;
    
    if(guild_name == null || server_num == null || auth_key == null || char_list == null){
        res_to_kakao_server(res, "client information is incorrect");
        return;        
    }

    char_list = Array.from(new Set(char_list.split('\n'))); // removal duplication.

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length == 0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 등록된 이사회가 아닙니다. 등록을 위해선 관리자에게 문의하세요.');
            return;          
        }

        if(result_guild_objs[0].auth_key != auth_key){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>에 구단주를 제거하기 위한 인증키 값이 올바르지 않습니다.');
            return;
        }

        var remove_complete = 0;
        var kakao_res_str = "";

        for(var i = 0; i < char_list.length; i++){

            db.remove_guild_member(result_guild_objs[0], guild_name, server_num, char_list[i], function(err, remove_member_obj, is_removed){

                if(err){
                    kakao_res_str += '!! ' + remove_member_obj.name + '(님) 제거 실패 (알 수 없는 오류)';
                }else if(!is_removed){
                    kakao_res_str += '!! ' + remove_member_obj.name + '(님) 제거 실패 (명단에 존재하지 않습니다.)';
                }else{
                    kakao_res_str += remove_member_obj.name + '(님) 제거 성공';
                }
                
                remove_complete++;

                if(remove_complete == char_list.length){
                    res_to_kakao_server(res, kakao_res_str);
                }else{
                    kakao_res_str += '\n';
                }
            });
        }
    });
});

api_router.post('/guildredeem', function (req, res) {

    if(!is_gss_run){
        res_to_kakao_server(res, "데이터베이스 오류가 발생했습니다.");
        return;
    }

    if(!is_db_run){
        res_to_kakao_server(res, "데이터베이스 오류가 발생했습니다.");
        return;        
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var guild_name = req.body.action.params.guild_name;
    var server_num = req.body.action.params.server_num;
    var redeem_code = req.body.action.params.redeem_code;

    if(guild_name == null || server_num == null || redeem_code == null){
        res_to_kakao_server(res, "client request error (invalid client information)");
        return;
    }

    db.find_guild(guild_name, server_num, function(err, find_guild_obj, result_guild_objs){

        if(err == db.db_err().INVALID){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>정보를 찾는 과정에서 알 수 없는 오류가 발생했습니다.');
            return;
        }else if(err == db.db_err().NOT_RUN){
            res_to_kakao_server(res, '데이터베이스 오류가 발생했습니다.');
            return;
        }

        if(result_guild_objs.length == 0){
            res_to_kakao_server(res, '이사회<' + find_guild_obj.name + '>는 등록된 이사회가 아닙니다. 등록을 위해선 관리자에게 문의하세요.');
            return;          
        }

        guild_members = result_guild_objs[0].members;
        redeem_bulk(res, guild_members, redeem_code, true);
    });

    //redeem_bulk(res, hidden_members, req.body.action.params.redeem_code, false);
});

api_router.post('/redeem', function (req, res) {

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var server_num = req.body.action.params.server_num;
    var redeem_code = req.body.action.params.redeem_code;
    var char_list = req.body.action.params.char_list;

    if(server_num == null || redeem_code == null || char_list == null){
        res_to_kakao_server(res, "client request error (invalid client information)");
        return;
    }

    char_list = Array.from(new Set(char_list.split('\n'))); // removal duplication.
    var char_list_cnt = Math.min(char_list.length, 30);
    var char_obj_list = new Array(char_list_cnt);

    for(var i = 0; i < char_obj_list.length; i++){
        var char_obj = new Object();
        char_obj.name = char_list[i];
        char_obj.server = req.body.action.params.server_num;

        char_obj_list[i] = char_obj;
    }

    redeem_bulk(res, char_obj_list, redeem_code, true);
});

api_router.post('/findspcinfo', function (req, res){

    if(!is_gss_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var pc = new Object();
    pc.name = req.body.action.params.pc_name;
    pc.year = req.body.action.params.pc_year;
    pc.type = req.body.action.params.pc_type;
    pc.team = req.body.action.params.pc_team;

    if(pc.year > 0){
        gss_v4.find_spc(pc, function(err, opc, rpc){

            if(err){
                res_to_kakao_server(res, "특수카드 정보를 찾을 수 없습니다.");
                return;
            }
    
            var kakao_res_str = "[" + pc.year + " " + pc.name + "(" + pc.type + ")]\n" +
                                "=====[본인 카드]=====\n" +
                                "이름 : " + opc.name + "\n" +
                                "연도 : " + opc.year + "\n" +
                                "타입 : " + opc.type + "\n" +
                                "구단 : " + opc.team + "\n" +
                                "=====[라이벌 카드]=====\n" +
                                "이름 : " + rpc.name + "\n" +
                                "연도 : " + rpc.year + "\n" +
                                "타입 : " + rpc.type + "\n" +
                                "구단 : " + rpc.team;
    
            res_to_kakao_server(res, kakao_res_str);
        });

    }else{
        gss_v4.find_spcs(pc, function(err, rpc_ary){

            if(err){
                res_to_kakao_server(res, "특수카드 정보를 찾을 수 없습니다.");
                return;
            }

            var kakao_res_str = pc.name + " (" + pc.type + ") <총 " + rpc_ary.length + "건>\n";

            for(var i = 0; i < rpc_ary.length; i++){

                kakao_res_str += "=====[" + (i + 1) + ". 본인 카드]=====\n" +
                                "이름 : " + rpc_ary[i].opc.name + "\n" +
                                "연도 : " + rpc_ary[i].opc.year + "\n" +
                                "타입 : " + rpc_ary[i].opc.type + "\n" +
                                "구단 : " + rpc_ary[i].opc.team + "\n" +
                                "=====[" + (i + 1) + ". 라이벌 카드]=====\n" +
                                "이름 : " + rpc_ary[i].rpc.name + "\n" +
                                "연도 : " + rpc_ary[i].rpc.year + "\n" +
                                "타입 : " + rpc_ary[i].rpc.type + "\n" +
                                "구단 : " + rpc_ary[i].rpc.team + "\n" + 
                                "**********************\n";
            }

            res_to_kakao_server(res, kakao_res_str);
        });
    }
});

api_router.post('/findhofinfo', function (req, res){

    if(!is_gss_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var hof_name = req.body.action.params.hof_name;

    gss_v4.find_hof_info(hof_name, function(err, info){

        if(err){
            res_to_kakao_server(res, "HOF 카드 정보를 찾을 수 없습니다.");
            return;
        }

        res_to_kakao_server(res, info);
    });
});

api_router.post('/gamble', function (req, res){

    if(!is_gss_run){
        res_to_kakao_server(res, "invalid server error (server database error)");
        return;
    }

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var gamble_type = req.body.action.params.gamble_type;
    var gamble_amount = req.body.action.params.gamble_amount;

    if(is_numeric(gamble_amount) == false){
        res_to_kakao_server(res, '입력한 갯수 정보가 올바르지 않습니다.');
    }

    gamble_amount = parseInt(gamble_amount);

    gss_v4.gamble(gamble_amount, gamble_type, function(err, result){

        if(err){
            console.log('invalid error while gambling');
            res_to_kakao_server(res, "invalid server error");
            return;
        }

        res_to_kakao_server(res, result);
    })
});

/**
 * @description 'rest api' -  'getthexp' : 승급 재료 카드의 경험치를 타이틀 홀더 카드의 경험치로 계산함.
 */
api_router.post('/getthexp', function (req, res){

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var old_card_type = req.body.action.params.old_card_type; // classic, fran, sig, master, ex, winners
    var old_card_level = req.body.action.params.old_card_level; // old card level (0~9 value . 200415)
    var old_card_exp = req.body.action.params.old_card_exp; // old card exp in this level

    if(old_card_type == undefined || old_card_level == undefined || old_card_exp == undefined){
        console.log('invalid param error in getthexp');
        res_to_kakao_server(res, 'invalid server error - client param error');
        return;
    }

    if(is_numeric(old_card_level) == false || is_numeric(old_card_exp) == false){
        res_to_kakao_server(res, '입력한 카드의 레벨 및 경험치 정보가 올바르지 않습니다.');
        return;
    }

    old_card_level = parseInt(old_card_level);
    old_card_exp = parseInt(old_card_exp);

    th_calc.convert_oc_exp_to_th_exp(old_card_type, old_card_level, old_card_exp, function(err, th_lev, th_exp, cur_req_exp){

        if(err){
            console.log('invalid error while convert_oc_exp_to_th_exp : ' + err);
            res_to_kakao_server(res, "입력된 카드의 정보가 올바르지 않습니다. 에러코드 : " + err);
            return;
        }
        
       
        var result = '승급시 타이틀 홀더 카드의 레벨은 (' + th_lev + ') 경험치는 (' + th_exp + '/' + cur_req_exp + ') 가 됩니다.'
        res_to_kakao_server(res, result);
    });
});


function is_numeric(value) {
    return /^-{0,1}\d+$/.test(value);
}

/**
 * @description 'rest api' -  'getthreqexp' : 타이틀 홀더 카드의 특정 레벨 달성을 위해 필요한 기존카드의 최소 경험치를 계산함.
 */
api_router.post('/getthreqexp', function (req, res){

    if(req.body.action == null && req.body.action.params == null){
        res_to_kakao_server(res, "invalid server error (invalid client request)");
        return;      
    }

    var th_card_level = req.body.action.params.th_card_level; // title holder card level
    var old_card_type = req.body.action.params.old_card_type; // old card type (classic, fran, sig, master, ex, winners)

    if(th_card_level == undefined || old_card_type == undefined){
        console.log('invalid param error in getthreqexp');
        res_to_kakao_server(res, 'invalid server error - client param error');
        return;
    }

    if(is_numeric(th_card_level) == false){
        res_to_kakao_server(res, '입력한 카드의 레벨 정보가 올바르지 않습니다.');
        return;
    }

    th_card_level = parseInt(th_card_level);

    th_calc.convert_th_lev_to_oc_exp(old_card_type, th_card_level, function(err, oc_lev, oc_exp){

        if(err){
            if(err == 3){ // 3 is TH_CALC_ERR.CALC_FAIL
                res_to_kakao_server(res, '레벨 (' + th_card_level + ') 타이틀 홀더 카드 제작시 ' + old_card_type.toUpperCase() + '등급 카드로는 만들 수 없습니다.');
            }else{
                console.log('invalid error while convert_th_lev_to_oc_exp : ' + err);
                res_to_kakao_server(res, "입력된 카드의 정보가 올바르지 않습니다. 에러코드 : " + err);
            }
            return;
        }

        var result = '레벨 (' + th_card_level + ') 타이틀 홀더 카드 제작시 ' + old_card_type.toUpperCase() + '등급 카드의 레벨 (' + oc_lev + ') 경험치 (' + oc_exp + ')가 최소로 요구됩니다.'
        res_to_kakao_server(res, result);
    });
});


app.listen(process.env.PORT || 8080, function () {
    console.log('run -> lpkakaoplus API server ' + (process.env.PORT || 8080));
});

var res_to_kakao_server = function (_res, _msg){

    const res_body = {
        result : _msg
    };

    _res.status(200).send(res_body);   
}

var redeem_bulk = function (_res, _char_list, _redeem_code, _is_feedback){

    var redeem_complete = 0;
    var kakao_res_str = "";

    for(var i = 0; i < _char_list.length; i++){

        redeem.redeem(_char_list[i], _redeem_code, function(_result_str){

            kakao_res_str += _result_str;
            redeem_complete++;

            if(redeem_complete == _char_list.length){
                
                if(_is_feedback){
                    res_to_kakao_server(_res, kakao_res_str);
                    //test
                    //console.log(kakao_res_str);
                }
                redeem_complete = 0;
                kakao_res_str = "";
            }else{
                kakao_res_str += "\n";
            }
        });
    }
}