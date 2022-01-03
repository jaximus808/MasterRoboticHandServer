const mongoose = require("mongoose");
const Schema = mongoose.Schema; 

const Arm = new Schema({
    id:
    {
        type:String, 
        required:true, 
        min: 3,
        max: 255
    },
    ip:
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
    port:
    {
        type: String, 
        required: true, 
        min: 6, 
        max: 1024
    },
    date:
    {
        type:Date,
        default: Date.now
    }
},{collection: "arm"})

module.exports = mongoose.model("Arm", Arm);
