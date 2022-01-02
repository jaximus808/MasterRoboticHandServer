if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Authentication = require("./routes/UserAuth");

app.use(express.json());
app.use(express.urlencoded({
    extended:false
}))

mongoose.connect(process.env.DB_CONNECT, {useNewUrlParser : true, useUnifiedTopology: true},()=>{
    console.log("Connected to db");
})

app.use("/", Authentication); 


app.listen(3000,() => console.log("server up"));