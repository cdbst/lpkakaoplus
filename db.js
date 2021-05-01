var mongoose = require('mongoose');
const guild_collection = require('./models/guild-model').guild;
const member_collection = require('./models/guild-model').member;

const DB_ERR = {
    INVALID : 1,
    NOT_RUN : 2,
  };
  
var db_err = function(){
    return DB_ERR;
}

var is_run = false;

var run = function(_db_uri, _callback){

    mongoose.connect(_db_uri, { useUnifiedTopology: true, useNewUrlParser: true });

    var db = mongoose.connection;

    db.on('error', function(err){
        console.log(err);
        is_run = false;
        _callback(err);
    });

    db.once('open', function(){
        is_run = true;
        console.log('connection to mongodb server success');
        _callback(null);
    });
}

var find_guild = function(_guild_name, _server_num, __callback){

    var find_guild_obj = new guild_collection();
    find_guild_obj.name = _guild_name;
    find_guild_obj.server = _server_num;

    if(!is_run){
        console.log('<err> fund_guild func : db is not running.');
        __callback(DB_ERR.NOT_RUN, find_guild_obj, null);
        return;
    }

    guild_collection.find({name : _guild_name, server : _server_num}, function(err, guilds){
        if(err){
            console.log(err);
            __callback(DB_ERR.INVALID, find_guild_obj, null);
            return;
        }
        
        __callback(null, find_guild_obj, guilds);
    });
}

var add_guild = function(_guild_name, _server_num, _auth_key, __callback){

    var add_guild_obj = new guild_collection();
    add_guild_obj.name = _guild_name;
    add_guild_obj.server = _server_num;
    add_guild_obj.auth_key = _auth_key;
    add_guild_obj.members = new Array();

    if(!is_run){
        console.log('<err> fund_guild func : db is not running.');
        __callback(DB_ERR.NOT_RUN, add_guild_obj);
        return;
    }

    add_guild_obj.save(function(err){

        if(err){
            console.log(err);
            __callback(DB_ERR.INVALID, add_guild_obj);
            return;            
        }
        __callback(null, add_guild_obj);
    });
}

var remove_guild = function(_guild_obj, __callback){

    if(!is_run){
        console.log('<err> remove_guild func : db is not running.');
        __callback(DB_ERR.NOT_RUN, _guild_obj);
        return;
    }

    guild_collection.deleteOne({_id : _guild_obj._id}, function(err){

        if(err){
            console.log(err);
            __callback(DB_ERR.INVALID, _guild_obj);
            return;
        }
        __callback(null, _guild_obj);
    });
}

var change_guild_auth_key = function(_guild_obj, _auth_key, __callback){

    if(!is_run){
        console.log('<err> change_guild_auth_key func : db is not running.');
        __callback(DB_ERR.NOT_RUN, _guild_obj);
        return;
    }

    guild_collection.updateOne({_id : _guild_obj._id}, { auth_key: _auth_key }, function(err, res){

        if(err){
            console.log(err);
            __callback(DB_ERR.INVALID, _guild_obj, false);
            return;            
        }

        __callback(null, _guild_obj, res.nModified);
    });
}

var add_guild_member = function(_guild_obj, _guild_name, _server_num, _member_name, __callback){

    var add_member_obj = new member_collection();
    add_member_obj.name = _member_name;
    add_member_obj.server = _server_num;
    add_member_obj.guild = _guild_name;

    if(!is_run){
        console.log('<err> add_guild_member func : db is not running.');
        __callback(DB_ERR.NOT_RUN, add_guild_obj);
        return;
    }
    

    guild_collection.updateOne({_id : _guild_obj._id}, { $addToSet: { members: add_member_obj } }, function(err, res){

        if(err){
            console.log(err);
            __callback(DB_ERR.INVALID, add_member_obj, false);
            return;            
        }

        __callback(null, add_member_obj, res.nModified);
    });
}

var remove_guild_member = function(_guild_obj, _guild_name, _server_num, _member_name, __callback){

    var remove_member_obj = new member_collection();
    remove_member_obj.name = _member_name;
    remove_member_obj.server = _server_num;
    remove_member_obj.guild = _guild_name;

    if(!is_run){
        console.log('<err> remove_guild_member func : db is not running.');
        __callback(DB_ERR.NOT_RUN, add_guild_obj);
        return;
    }

    guild_collection.updateOne({_id : _guild_obj._id}, { $pull: { members: remove_member_obj } }, function(err, res){

        if(err){
            console.log(err);
            __callback(DB_ERR.INVALID, remove_member_obj, false);
            return;            
        }
        
        __callback(null, remove_member_obj, res.nModified);
    });
}

module.exports.run = run;
module.exports.db_err = db_err;
module.exports.find_guild = find_guild;
module.exports.add_guild = add_guild;
module.exports.remove_guild = remove_guild;
module.exports.change_guild_auth_key = change_guild_auth_key;
module.exports.add_guild_member = add_guild_member;
module.exports.remove_guild_member = remove_guild_member;