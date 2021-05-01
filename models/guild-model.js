const mongoose = require('mongoose');
const schema  = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const member_schema = new schema({
    name: {
        type : String,
        require : true
    },
    server: {
        type : Number
    },
    guild: {
        type : String
    }
},{ _id : false });

const guild_schema = new schema({
    name : {
        type : String,
        required : true
    },
    server: {
        type : Number,
        required : true
    },
    members: [{type : member_schema}],
    auth_key: {
        type : String,
        required : true
    }
});

module.exports.member = mongoose.model('members', member_schema);
module.exports.guild = mongoose.model('guilds', guild_schema);

