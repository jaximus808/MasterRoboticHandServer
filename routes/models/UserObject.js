const mongoose = require("mongoose");
const Schema = mongoose.Schema; 

const User = new Schema({
    username:
    {
        type:String, 
        required:true, 
        min: 3,
        max: 255
    },
    email:
    {
        type: String, 
        required: true, 
        min: 3,
        max: 255
    }, 
    password:
    {
        type: String,
        require: true, 
        min: 6, 
        max: 1024,
    },
    date:
    {
        type:Date,
        default: Date.now
    }
},{collection: "user"})

module.exports = mongoose.model("User", User);
