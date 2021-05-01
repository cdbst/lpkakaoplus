//lev_info(s) is fair of (lev):(exp)

const MAX_CARD_LEV = 9;

const classic_lev_info = [2, 2, 4, 6, 8, 8, 12, 12, 12];
const franchise_lev_info = [2, 1, 2, 2, 4, 6, 10, 13, 13];
const ex_lev_info = [2, 1, 2, 4, 8, 8, 12, 12, 12];
const winners_lev_info = [2, 1, 6, 8, 8, 12, 12, 12, 12];
const master_lev_info = [2, 1, 1, 2, 3, 5, 7, 10, 12];
const th_lev_info = [2, 1, 1, 2, 4, 6, 8, 12, 15];
const signature_lev_info = [2, 1, 2, 2, 4, 6, 10, 12, 14];

const TH_CALC_ERR = {
    INVALID_LEV : 1,
    INVALID_EXP : 2,
    CALC_FAIL : 3,
};

/**
 * @description convert old(sig, ex, winners, classic, fran, master) card exp to title hold card exp
 * 
 * @param {string} old_card_type old card type such as ('sig', 'ex', 'winners', 'classic', 'fran', 'master')
 * @param {int} old_card_level (sig, ex, winners, classic, fran, master) card level
 * @param {int} old_card_exp sig, ex, winners, classic, fran, master ) card exp
 * @param {function} _callback completion callback routine
 */
function convert_oc_exp_to_th_exp(old_card_type, old_card_level, old_card_exp, _callback){
    var oc_info = undefined;
    var div_ratio = undefined;

    if(old_card_type == 'sig'){
        oc_info = signature_lev_info;
        div_ratio = 0.8;
    }else if(old_card_type == 'ex'){
        oc_info = ex_lev_info;
        div_ratio = 0.5;
    }else if(old_card_type == 'winners'){
        oc_info = winners_lev_info;
        div_ratio = 0.5;
    }else if(old_card_type == 'classic'){
        oc_info = classic_lev_info;
        div_ratio = 0.3;
    }else if(old_card_type == 'fran'){
        oc_info = franchise_lev_info;
        div_ratio = 0.4;
    }else if(old_card_type == 'master'){
        oc_info = master_lev_info;
        div_ratio = 0.9;
    }

    if(oc_info.length < old_card_level){
        _callback(TH_CALC_ERR.INVALID_LEV, undefined, undefined);
        return;
    }

    //oc_info[old_card_level] is exp info : old card lev nagative or overflow condition check
    if(old_card_exp < 0 || old_card_exp > oc_info[old_card_level]){
        _callback(TH_CALC_ERR.INVALID_EXP, undefined, undefined);
        return;
    }

    var stamp_num = 0;

    for(var i = 0; i < old_card_level; i++){
        stamp_num += oc_info[i];
    }

    stamp_num += old_card_exp;

    stamp_num = stamp_num * div_ratio;
    stamp_num = Math.floor(stamp_num);
    stamp_num = parseInt(stamp_num);

    //start leveling!
    for(var i = 0; i < th_lev_info.length; i++){
        if(stamp_num < th_lev_info[i]){
            _callback(undefined, i, stamp_num, th_lev_info[i]);
            return;
        }

        stamp_num -= th_lev_info[i];
    }

    //remained stamp_num is current exp of th_lev
    _callback(TH_CALC_ERR.CALC_FAIL, undefined, undefined, undefined);
}

/**
 * @description convert title holder card level to (sig, ex, winners, classic, fren, master) card level and exp
 * 
 * @param {*} old_card_type old card type
 * @param {*} th_card_level title holder card level
 * @param {*} _callback completion callback routine
 */
function convert_th_lev_to_oc_exp(old_card_type, th_card_level, _callback){
    var oc_info = undefined;
    var div_ratio = undefined;

    if(old_card_type == 'sig'){
        oc_info = signature_lev_info;
        div_ratio = 0.8;
    }else if(old_card_type == 'ex'){
        oc_info = ex_lev_info;
        div_ratio = 0.5;
    }else if(old_card_type == 'winners'){
        oc_info = winners_lev_info;
        div_ratio = 0.5;
    }else if(old_card_type == 'classic'){
        oc_info = classic_lev_info;
        div_ratio = 0.3;
    }else if(old_card_type == 'fran'){
        oc_info = franchise_lev_info;
        div_ratio = 0.4;
    }else if(old_card_type == 'master'){
        oc_info = master_lev_info;
        div_ratio = 0.9;
    }

    if(th_card_level > th_lev_info.length || th_card_level <= 0){
        _callback(TH_CALC_ERR.INVALID_LEV, undefined, undefined);
        return;        
    }

    var total_needed_stamp = 0;

    for(var i = 0; i < th_card_level; i++){
        total_needed_stamp += th_lev_info[i];
    }

    var stamp_num = 0;

    for(var i = 0; i < oc_info.length; i++){
        for(var j = 0; j < oc_info[i]; j++){
            var converted_stamp_num = stamp_num * div_ratio;
            converted_stamp_num = Math.floor(converted_stamp_num);
            converted_stamp_num = parseInt(converted_stamp_num);

            if(converted_stamp_num >= total_needed_stamp){
                _callback(undefined, i, j);
                return;
            }
            stamp_num++;
        }
    }

    _callback(TH_CALC_ERR.CALC_FAIL, undefined, undefined);
}

module.exports.convert_oc_exp_to_th_exp = convert_oc_exp_to_th_exp;
module.exports.convert_th_lev_to_oc_exp = convert_th_lev_to_oc_exp;