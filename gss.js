const GoogleSpreadsheet = require('google-spreadsheet');
const doc = new GoogleSpreadsheet('1gKaWSPnkFDqK3tI_OnWlLHNmKre0HpkdAX1eSf4fSq8');

var spc_sheet = null;

const GSS_ERR = {
  INVALID : 1,
  CANNOT_FOUND : 2,
  LIMIT : 3,
  CERT : 4
};

run = function(_callback){

  var creds = require('./config/gss-config.json');
  
  doc.useServiceAccountAuth(creds, function(err){

    if(err){
      console.log(err);
      _callback(GSS_ERR.INVALID);
      return;
    }

    doc.getInfo(function(err, info) {

      if(err){
        console.log(err);
        _callback(GSS_ERR.INVALID);
        return;
      }

      spc_sheet = info.worksheets[0];

      if(spc_sheet == null){

          _callback(GSS_ERR.CANNOT_FOUND);
          return;
      }

      _callback(null);

    });
  });
}

find_spc = function (_pc, _callback) {

    var query = '(' + 'pcname=' + _pc.name + 
                ' AND pcyear=' + _pc.year + 
                ' AND pctype=' + _pc.type + 
                ' AND pcteam=' + _pc.team + ')';

    spc_sheet.getRows({
      limit : 1,
      query : query

    }, function(err, rows){

      if(err){
        console.log(err);
        _callback(GSS_ERR.INVALID, null, null);
        return;
      }

      if(rows.length <= 0){
        _callback(GSS_ERR.CANNOT_FOUND, null, null);
        return;
      }

      var opc = new Object();
      opc.name = rows[0].opcname;
      opc.year = rows[0].opcyear;
      opc.type = rows[0].opctype;
      opc.team = rows[0].opcteam;

      var rpc = new Object();
      rpc.name = rows[0].rpcname;
      rpc.year = rows[0].rpcyear;
      rpc.type = rows[0].rpctype;
      rpc.team = rows[0].rpcteam;

      _callback(null, opc, rpc);
    });
}

find_spcs = function (_pc, _callback) {

  var query = '(' + 'pcname=' + _pc.name +  
              ' AND pctype=' + _pc.type + 
              ' AND pcteam=' + _pc.team + ')';

  spc_sheet.getRows({
    query : query

  }, function(err, rows){

    if(err){
      console.log(err);
      _callback(GSS_ERR.INVALID, null, null);
      return;
    }

    if(rows.length <= 0){
      _callback(GSS_ERR.CANNOT_FOUND, null, null);
      return;
    }

    var pc_ary = new Array(rows.length);

    for(var i = 0; i < rows.length; i++){
      pc_ary[i] = new Object();

      pc_ary[i].opc = new Object();
      pc_ary[i].opc.name = rows[i].opcname;
      pc_ary[i].opc.year = rows[i].opcyear;
      pc_ary[i].opc.type = rows[i].opctype;
      pc_ary[i].opc.team = rows[i].opcteam;

      pc_ary[i].rpc = new Object();
      pc_ary[i].rpc.name = rows[i].rpcname;
      pc_ary[i].rpc.year = rows[i].rpcyear;
      pc_ary[i].rpc.type = rows[i].rpctype;
      pc_ary[i].rpc.team = rows[i].rpcteam;
    }
    
    _callback(null, pc_ary);
  });
}

module.exports.run = run;
module.exports.find_spc = find_spc;
module.exports.find_spcs = find_spcs;