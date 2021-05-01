const unirest = require('unirest');
const redeem_url = 'https://nshop.plaync.com/shop/h2/kr/redeem';


var redeem = function(_target_user, _redeem_code, _callback){

    unirest.post(redeem_url)
    .headers({
        'Content-Type' : 'application/json'
    })
    .send({
        "gameServerId": _target_user.server.toString(),
        "charName": _target_user.name,
        "couponKey": _redeem_code
    })
    .end(function (redeem_res) {

        var result_str = "";
        var req_msg;

        if(redeem_res == undefined){ // ncsoft server response invalid data
            console.log("redeem fail - ncsoft server response invalid data");
            result_str = "쿠폰 서버로 부터 알 수 없는 오류 1건 발생";
            _callback(result_str);
            return;
        }

        try {
            var req_msg = JSON.parse(redeem_res.request.body);
        } catch(err) {
            console.log("exception occured in redeem response parsing : " + err);
            result_str = "알 수 없는 오류 1건 발생";
            _callback(result_str);
            return;
        }
        
        if(redeem_res.body.resultCode == 0){

            result_str = req_msg.charName + "(님) 입력 (성공)";

        }else if(redeem_res.body.resultCode == 4000){ // invalid game char

            result_str = "!! " + req_msg.charName + "(님) 입력 실패 (케릭터 정보 없음)";
            
        }else if(redeem_res.body.resultCode == -1){

            if(redeem_res.body.resultMessage == "EXCEED_USER_REGISTRATION_LIMIT_ERROR"){

                result_str = "!! " + req_msg.charName + "(님) 입력 실패 (이미 입력 됨)";
                
            }else if(redeem_res.body.resultMessage == "INVALID_COUPON_ERROR"){

                result_str = "!! " + req_msg.charName + "(님) 입력 실패 (유효하지 않은 쿠폰)";
                
            }else{

                result_str = "!! " + req_msg.charName + "(님) 입력 실패 (알 수 없는 오류)";    
            }
        }else{

            result_str = "!! " + req_msg.charName + "(님) 입력 실패 (알 수 없는 오류)";
        }

        _callback(result_str);
    }); 
}

module.exports.redeem = redeem;