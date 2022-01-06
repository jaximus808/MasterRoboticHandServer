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
        type: Number, 
        required: true, 
        min: 0, 
        max: 65535
    },
    connectedFleetIP:
    {
        type: String,
        required: true, 
        min: 0,
        max: 255
    }
    ,
    connectedFleetPort:
    {
        type: Number,
        required: true,
        min: 0, 
        max: 65535
    },
    connected:
    {
        type:Boolean,
        required: true, 
    },
    date:
    {
        type:Date,
        default: Date.now
    }
},{collection: "arm"})

module.exports = mongoose.model("Arm", Arm);
