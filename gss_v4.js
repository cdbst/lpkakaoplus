const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './config/token.json';
const CREDENTIALS_PATH = './config/credentials.json';
const SPREADSHEET_ID = '1gKaWSPnkFDqK3tI_OnWlLHNmKre0HpkdAX1eSf4fSq8';

var spc_sheet = undefined;
var hof_sheet = undefined;
var gamble_lucky_box_sheet = undefined;
var gamble_th_box_sheet = undefined;
var gamble_th_scout_box_sheet = undefined;
var auth = undefined;

const spc_sheet_col = {
    pc_name : 0,
    pc_year : 1,
    pc_type : 2,
    pc_team : 3,
    opc_name : 4,
    opc_year : 5,
    opc_type : 6,
    opc_team : 7,
    rpc_name : 8,
    rpc_year : 9,
    rpc_type : 10,
    rpc_team : 11
};

const hof_sheet_col = {
    name : 0,
    skill : 1,
    explosion : 2,
    very : 3,
    description : 4
}

const gamble_sheet_col = {
    item : 0,
    amount : 1,
    chance : 2
}

const GSS_V4_ERR = {
    INVALID : 1,
    CANNOT_FOUND : 2,
    LIMIT : 3,
    CERT : 4
  };


// Load client secrets from a local file.
function run(_callback) {

    fs.readFile(CREDENTIALS_PATH, (err, content) => {

        if (err){
            console.log('gss_v4 : Error loading client secret file:', err);
            _callback('gss_v4 : Error loading client secret file:', err);
            return; 
        }
        // Authorize a client with credentials, then call the Google Sheets API.
        authorize(JSON.parse(content), _callback);
    });
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, _callback) {

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {

        if (err){
            //remove below code bacause this app cannot get user's input
            // return get_new_token(oAuth2Client, _callback);
            console.log('gss_v4 : authorize is failed. token file is not exist');
            _callback(GSS_V4_ERR.INVALID);
            return;
        }

        oAuth2Client.setCredentials(JSON.parse(token));
        auth = oAuth2Client; // auth is global resource

        console.log('gss_v4 : setting up authorize is successful');
        _callback(undefined);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function get_new_token(oAuth2Client, _callback) {
    7
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            _callback(oAuth2Client);
        });
    });
}

function get_spc_sheet(_callback){

    if(auth == undefined){
        console.log('gss_v4 : get_spc_sheet : auth is not set condition');
        _callback(GSS_V4_ERR.INVALID);
        return;
    }

    sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'spc_list',
    }, (err, res) => {

        if (err){
            console.log('gss_v4 : fail with getting spc_list from google server (api err) ' + err);
            _callback(GSS_V4_ERR.INVALID);
            return;
        }

        const rows = res.data.values;

        if (rows.length) {
            spc_sheet = rows;
            console.log('gss_v4 : success with setting up spc sheet information');
            _callback(undefined);
        } else {
            spc_sheet = undefined;
            console.log('gss_v4 : spc sheet information is empty');
            _callback(GSS_V4_ERR.CANNOT_FOUND);
        }
    });
}

function get_hof_sheet(_callback){

    if(auth == undefined){
        console.log('gss_v4 : get_hof_sheet : auth is not set condition');
        _callback(GSS_V4_ERR.INVALID);
        return;
    }

    sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'hof',
    }, (err, res) => {

        if (err){
            console.log('gss_v4 : fail with getting hof sheet from google server (api err) ' + err);
            _callback(GSS_V4_ERR.INVALID);
            return;
        }

        const rows = res.data.values;

        if (rows.length) {
            hof_sheet = rows;
            console.log('gss_v4 : success with setting up hof sheet information');
            _callback(undefined);
        } else {
            hof_sheet = undefined;
            console.log('gss_v4 : hof sheet information is empty');
            _callback(GSS_V4_ERR.CANNOT_FOUND);
        }
    });
}

function get_gamble_lucky_box_sheet(_callback){

    if(auth == undefined){
        console.log('gss_v4 : get_gamble_lucky_box_sheet : auth is not set condition');
        _callback(GSS_V4_ERR.INVALID);
        return;
    }

    sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'gamble_lucky_box',
    }, (err, res) => {

        if (err){
            console.log('gss_v4 : fail with getting get_gamble_lucky_box_sheet from google server (api err) ' + err);
            _callback(GSS_V4_ERR.INVALID);
            return;
        }

        const rows = res.data.values;

        if (rows.length) {

            rows.shift();

            gamble_lucky_box_sheet = new Array();

            rows.forEach(row => {
                var chance = row[gamble_sheet_col.chance];
                var item = row[gamble_sheet_col.item];
                var amount = row[gamble_sheet_col.amount].toString();

                for(var i = 0; i < (chance * 10); i++){
                    gamble_lucky_box_sheet.push({item : item, amount : amount});
                }
            });
            console.log('gss_v4 : success with setting up gamble_lucky_box_sheet information');
            _callback(undefined);
        } else {
            gamble_lucky_box_sheet = undefined;
            console.log('gss_v4 : gamble lucky box sheet information is empty');
            _callback(GSS_V4_ERR.CANNOT_FOUND);
        }
    });
}

/**
 * @description setting up sheet of title holder box
 * 
 * @param {function} _callback completion routine
 */
function get_gamble_th_box_sheet(_callback){

    if(auth == undefined){
        console.log('gss_v4 : get_gamble_th_box_sheet : auth is not set condition');
        _callback(GSS_V4_ERR.INVALID);
        return;
    }

    sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'gamble_th_box',
    }, (err, res) => {

        if (err){
            console.log('gss_v4 : fail with getting gamble_th_box_sheet from google server (api err) ' + err);
            _callback(GSS_V4_ERR.INVALID);
            return;
        }

        const rows = res.data.values;

        if (rows.length) {

            rows.shift();

            gamble_th_box_sheet = new Array();

            rows.forEach(row => {
                var chance = row[gamble_sheet_col.chance];
                var item = row[gamble_sheet_col.item];
                var amount = row[gamble_sheet_col.amount].toString();

                for(var i = 0; i < (chance * 10); i++){
                    gamble_th_box_sheet.push({item : item, amount : amount});
                }
            });

            console.log('gss_v4 : success with setting up gamble_th_box_sheet information');
            _callback(undefined);
        } else {
            gamble_th_box_sheet = undefined;
            console.log('gss_v4 : gamble title holder sheet information is empty');
            _callback(GSS_V4_ERR.CANNOT_FOUND);
        }
    });
}

/**
 * @description setting up sheet of title holder scout box
 * 
 * @param {function} _callback completion routine
 */
function get_gamble_th_scout_box_sheet(_callback){

    if(auth == undefined){
        console.log('gss_v4 : get_gamble_th_scout_box_sheet : auth is not set condition');
        _callback(GSS_V4_ERR.INVALID);
        return;
    }

    sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'gamble_th_scout_box',
    }, (err, res) => {

        if (err){
            console.log('gss_v4 : fail with getting get_gamble_th_scout_box_sheet from google server (api err) ' + err);
            _callback(GSS_V4_ERR.INVALID);
            return;
        }

        const rows = res.data.values;

        if (rows.length) {

            rows.shift();

            gamble_th_scout_box_sheet = new Array();

            rows.forEach(row => {
                var chance = row[gamble_sheet_col.chance];
                var item = row[gamble_sheet_col.item];
                var amount = row[gamble_sheet_col.amount].toString();

                for(var i = 0; i < (chance * 10); i++){
                    gamble_th_scout_box_sheet.push({item : item, amount : amount});
                }
            });

            console.log('gss_v4 : success with setting up gamble_th_scout_box_sheet information');
            _callback(undefined);
        } else {
            gamble_th_scout_box_sheet = undefined;
            console.log('gss_v4 : gamble title holder scout sheet information is empty');
            _callback(GSS_V4_ERR.CANNOT_FOUND);
        }
    });
}


//gamble type is 'th', 'th_scout' or 'lucky'
function gamble(amount, type, _callback){

    if(auth == undefined){
        console.log('gss_v4 : gamble - auth information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    if(gamble_th_box_sheet == undefined){
        console.log('gss_v4 : gamble - gamble_th_box_sheet information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    if(gamble_lucky_box_sheet == undefined){
        console.log('gss_v4 : gamble - gamble_lucky_box_sheet information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    if(gamble_th_scout_box_sheet == undefined){
        console.log('gss_v4 : gamble - gamble_th_scout_box_sheet information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    var gamble_sheet = undefined;
    var box_type_str = undefined;

    if(type == 'lucky'){
        gamble_sheet = gamble_lucky_box_sheet;
        box_type_str = '럭키 박스';
    }else if (type == 'th'){
        gamble_sheet = gamble_th_box_sheet;
        box_type_str = '타이틀 홀더 제작 박스';
    }else if (type == 'th_scout'){
        box_type_str = '타이틀 홀더 영입 박스';
        gamble_sheet = gamble_th_scout_box_sheet;
    }else{
        console.log('gss_v4 : gamble - invalid gamble type paramter');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    var result = {};

    for(var i = 0; i < amount; i++){
        var pick = gamble_sheet[Math.floor(Math.random() * gamble_sheet.length)];

        var pick_item = pick.item.split(',');
        var pick_amount = pick.amount.split(',');

        for(var j = 0; j < pick_item.length; j++){

            if((pick_item[j] in result) == false){
                result[pick_item[j]] = 0;
            }

            result[pick_item[j]] = result[pick_item[j]] + parseInt(pick_amount[j]);
        }
    }

    var result_str = box_type_str + ' ' + amount + '개 결과 : \n';

    for(var key in result){
        result_str += key + ' (' + result[key] + '개) \n';
    }

    _callback(undefined, result_str);

}


function find_spc(pc, _callback){

    if(auth == undefined){
        console.log('gss_v4 : find_spc - auth information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined, undefined);
        return;
    }

    if(spc_sheet == undefined){
        console.log('gss_v4 : find_spc - sheet information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined, undefined);
        return;
    }

    var opc = undefined;
    var rpc = undefined;

    for(var i = 0; i < spc_sheet.length; i++){
        row = spc_sheet[i];

        if(row[spc_sheet_col.pc_name] == pc.name &&
            row[spc_sheet_col.pc_year] == pc.year && 
            row[spc_sheet_col.pc_type] == pc.type &&
            row[spc_sheet_col.pc_team] == pc.team ){

                opc = new Object();
                rpc = new Object();

                var opc = new Object();
                opc.name = row[spc_sheet_col.opc_name];
                opc.year = row[spc_sheet_col.opc_year];
                opc.type = row[spc_sheet_col.opc_type];
                opc.team = row[spc_sheet_col.opc_team];

                var rpc = new Object();
                rpc.name = row[spc_sheet_col.rpc_name];
                rpc.year = row[spc_sheet_col.rpc_year];
                rpc.type = row[spc_sheet_col.rpc_type];
                rpc.team = row[spc_sheet_col.rpc_team];

                break;
        }
    }

    if(opc == undefined || rpc == undefined){
        _callback(GSS_V4_ERR.CANNOT_FOUND, null, null);
    }else{
        _callback(null, opc, rpc);
    }
}

function find_spcs(pc, _callback){

    if(auth == undefined){
        console.log('gss_v4 : find_spc - auth information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    if(spc_sheet == undefined){
        console.log('gss_v4 : find_spc - sheet information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    var pc_ary = new Array();

    for(var i = 0; i < spc_sheet.length; i++){
        row = spc_sheet[i];

        if(row[spc_sheet_col.pc_name] == pc.name &&
            row[spc_sheet_col.pc_type] == pc.type &&
            row[spc_sheet_col.pc_team] == pc.team ){

                var opc_rpc_obj = new Object();

                opc_rpc_obj.opc = new Object;
                opc_rpc_obj.opc.name = row[spc_sheet_col.opc_name];
                opc_rpc_obj.opc.year = row[spc_sheet_col.opc_year];
                opc_rpc_obj.opc.type = row[spc_sheet_col.opc_type];
                opc_rpc_obj.opc.team = row[spc_sheet_col.opc_team];

                opc_rpc_obj.rpc = new Object();
                opc_rpc_obj.rpc.name = row[spc_sheet_col.rpc_name];
                opc_rpc_obj.rpc.year = row[spc_sheet_col.rpc_year];
                opc_rpc_obj.rpc.type = row[spc_sheet_col.rpc_type];
                opc_rpc_obj.rpc.team = row[spc_sheet_col.rpc_team];

                pc_ary.push(opc_rpc_obj);
        }
    }

    if(pc_ary.length == 0){
        _callback(GSS_V4_ERR.CANNOT_FOUND, undefined);
    }else{
        _callback(undefined, pc_ary);
    }
}

function find_hof_info(hof_name, _callback){

    if(auth == undefined){
        console.log('gss_v4 : find_hof_info - auth information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    if(hof_sheet == undefined){
        console.log('gss_v4 : find_hof_info - sheet information is not set condition');
        _callback(GSS_V4_ERR.INVALID, undefined);
        return;
    }

    var info = undefined;

    for(var i = 0; i < hof_sheet.length; i++){
        var row = hof_sheet[i];

        if(row[hof_sheet_col.name] == hof_name){
            info = '[' + row[hof_sheet_col.name] + ']\n';
            info += '특수 능력 : ' + row[hof_sheet_col.skill] + '\n';
            info += '폭발 : ' + row[hof_sheet_col.explosion] + '\n';
            info += '대폭 증가 : ' + row[hof_sheet_col.very] + '\n';
            info += row[hof_sheet_col.description];
			break;
        }
    }

    if(info == undefined){
        _callback(GSS_V4_ERR.CANNOT_FOUND, undefined);
    }else{
        _callback(undefined, info);
    }
}

module.exports.find_spc = find_spc;
module.exports.find_spcs = find_spcs;
module.exports.find_hof_info = find_hof_info;
module.exports.gamble = gamble;

module.exports.get_spc_sheet = get_spc_sheet;
module.exports.get_hof_sheet = get_hof_sheet;
module.exports.get_gamble_th_box_sheet = get_gamble_th_box_sheet;
module.exports.get_gamble_lucky_box_sheet = get_gamble_lucky_box_sheet;
module.exports.get_gamble_th_scout_box_sheet = get_gamble_th_scout_box_sheet;
module.exports.run = run;