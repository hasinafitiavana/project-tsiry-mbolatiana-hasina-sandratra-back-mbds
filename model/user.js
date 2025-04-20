const mongoose = require('mongoose');
const validator = require('validator');
const {Schema, model} = mongoose;
require("./role");

const UserSchema=new Schema({
    lastname:{
        type:String,
        required:[true, "Nom obligatoire"]
    },
    firstname:{
        type:String,
    },
    email:{
        type:String,
        required:[true,'Email manquant'],
        validate:{
            validator:validator.isEmail,
            message:'{VALUE} n\'est pas un email valide'
        }
    },
    password:{
        type:String,
        required:[true,'Mot de passe obligatoire']
    },
    password2:{
        type:String,
        select:false,
        required:[true,'Veuillez resaisir votre mot de passe'],
    },
    roles: [{
        type: String,
        ref: 'roles'
    }],
})

const User=model('users',UserSchema);

module.exports=User;