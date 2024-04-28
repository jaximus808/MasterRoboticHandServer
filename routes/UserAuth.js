const router = require("express").Router();
const User = require("./models/UserObject");
const Arm = require("./models/ArmObject");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {registerValidation, loginValidation }= require("./validation")
const verifyUserToken = require("./userTokenVerify")
const verifyArmPassword = require("./armPassVerify")
const verifyFleetServerPassword = require("./serverFleetVerify")
const {JsonDB} = require("node-json-db")
const { Config } = require("node-json-db/dist/lib/JsonDBConfig")

const db = new JsonDB(new Config("fleetServers", true, false, "/"))

function isNumber(char) {
    if (typeof char !== 'string') {
      return false;
    }
  
    if (char.trim() === '') {
      return false;
    }
  
    return !isNaN(char);
  }

router.post("/api/loginArm", async(req, res) =>
{
    console.log(req.body);
    //asks for id and username; 

    const ArmMatch = await Arm.findOne({id: req.body.id});
    if(!ArmMatch) res.status(400).send({error:true, message:"Wrong id or password"});

    const validPass = await bcrypt.compare(req.body.password, ArmMatch.password);
    if(!validPass) return res.status(400).send({error:true, message:"Wrong id or password"})

    if(!ArmMatch.connected) return res.status(400).send({error:true, message:"Arm is not online" });

    //if everything good then send the ip and port of the server
    
    return res.send({error:false, message:ArmMatch.connectedIp, port: ArmMatch.connectedFleetPort});

})

router.post("/api/user/loginUser", async(req,res) =>
{
    console.log(req.body)
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send({error: true, message:error.details[0].message});

    const emailExist = await User.findOne({email: req.body.email});
    if(!emailExist) return res.status(400).send({error:true,message:"email or pass incorrect"})
    
    const validPass = await bcrypt.compare(req.body.password,emailExist.password);
    if(!validPass) return res.status(400).send({error:true,message:"email or pass incorrect"})
    
    const token = jwt.sign({_id: emailExist._id},process.env.TOKEN_SECRET);
    
    ///db.push("/fleetServers", {ip:"75.85.46.243",port:8000, active:true}, false)
    console.log("nice")
    res.send({error:false, message:token}); 
})

router.post("/api/user/createUser", async(req, res) =>
{
    console.log("register requesting here ");
    console.log(req.body)
    
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send({error:true, message: error.details[0].message});
    const emailExist = await User.findOne({email: req.body.email});
    if(emailExist) return res.status(400).send({error:true, message: "emailExists"});

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashPassword,
    });
    console.log("pog")
    try
    {
        const savedUser = await user.save();
        const token = jwt.sign({_id: savedUser._id}, process.env.TOKEN_SECRET);
        res.send({error: false, message: token});
        
    }
    catch(error)
    {
        console.log("error");
        res.status(400).send({error:true, message: error.message}); 
    }
})

router.post("/api/user/accountDetails", verifyUserToken, async(req, res) =>
{
    console.log("sending user data")
    const userInfo = await User.findById({_id: req.user._id})
    try 
    {
        res.send({error:false, message:"", email:userInfo.email, username:userInfo.username});
    }
    catch
    {
        res.send({error:true, message:"Something went wrong"})
    }
    
})

router.post("/api/user/connectArm",verifyUserToken,async(req,res) =>
{
    console.log(req.body)
    const armExist = await Arm.findOne({id:req.body.id})
    if(!armExist) return res.status(400).send({error:true, message:"id or password incorrect"}); 

    const validPass = await bcrypt.compare(req.body.password,armExist.password )
    if(!validPass) return res.status(400).send({error:true, message:"id or password incorrect"});

    if(!armExist.connected) return res.status(400).send({error:true, message:"Arm is not connected, connect arm or try again"})
    res.send({error:false,message:"connecting", ip:armExist.connectedFleetIP, port: armExist.connectedFleetPort});
})

router.post("/api/arm/register", verifyArmPassword, async(req, res)=>
{
    let ip = req.body.ip;
    const splitIp = ip.split(".");
    if(splitIp.length != 4) return res.status(400).send({error:true,existing:false,message:"" });
    
    for(let i = 0; i < 4; i++)
    {
        if(parseInt(splitIp[i]) >= 255 && parseInt(splitIp[i]) <= 0 ) return res.status(400).send({error:true,existing:false ,message:""})
    }
    if(parseInt(req.body.port) < 0) return res.status(400).send({error:true,existing:false,message:"" });
    
    //now need to look for a fleet server: will make a better algorithm later 
    var fleetServers = db.getData("/fleetServers");
    var minConnected = 20000000;
    var bestServer; 
    for(let i = 0; i < fleetServers.length; i++)
    {
        if(fleetServers[i].connected < minConnected)
        {
            bestServer = i; 
        }
    }
    const existingArmId = await Arm.findOne({id: req.body.id})
    console.log("nice")
    //connected will be send from the fleet server
    if(existingArmId)
    {
        try
        {
            
            existingArmId.connectedFleetIP = fleetServers[bestServer].ip
            existingArmId.connectedFleetPort = fleetServers[bestServer].port   
            await existingArmId.save();
            return res.status(400).send({error:true,existing:true ,message:fleetServers[bestServer].ip, port:fleetServers[bestServer].port    });
    
        }
        catch(e)
        {
            console.log(e);
            res.status(400).send({error:true,existing:false ,message:""})
        }
    }
    
    console.log("pog")

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.armPass, salt);

    const arm = new Arm(
        {
            id: req.body.id,
            ip: req.body.ip, 
            password: hashedPassword,
            port: req.body.port,
            connectedFleetIP: fleetServers[bestServer].ip, 
            connectedFleetPort: fleetServers[bestServer].port,
            connected: false //connected will be sent from the fleet server
        }
    )
    try
    {
        await arm.save()
        res.status(200).send({error:false,existing:false, message:fleetServers[bestServer].ip, port:fleetServers[bestServer].port })
        
    }
    catch(e)
    {
        console.log(e);
        res.status(400).send({error:true,existing:false ,message:""})
    }
})

router.post("/server/auth/registerFleet", verifyFleetServerPassword, async(req ,res)=>
{
    const fleets = db.getData("/fleetServers");
    let unfound = true; 
    const unchnagedIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let ip;
    for(let i = 0; i < unchnagedIp.length; i++)
    {
        if(isNumber(unchnagedIp[i]))
        {
            ip=unchnagedIp.slice(i,unchnagedIp.length);
            break;
        }

    }
    for(let i = 0; i < fleets.length; i++)
    {
        if(ip === fleets[i].ip)
        {
            unfound = false;
            fleets[i].active = true;  
            break; 
        }
    }
    if(unfound)
    {
        fleets.push({
            "ip" : ip,
            "port" : parseInt(req.body.port),
            "active" : true,
            "connected" : 0
        })
        db.push("/fleetServers",fleets)
    }

    res.send({error:false, message:"success"});
})

router.post("/server/auth/disconnectArmClient", verifyArmPassword,verifyFleetServerPassword, async(req, res) =>
{
    const findArm = await Arm.findOne({id: req.body.id}); 
    if(!findArm)  return res.status(400).send({error:true,message:"Something went wrong"});
    
    if(!findArm.connected) return res.status(400).send({error:true, message:"Arm is not connected to a fleet server"});

    try
    {
        findArm.connected = false; 
        findArm.save();
        res.send({error:false, message:"Success"})
    }
    catch(e)
    {
        
        res.status(400).send({error:true, message:"Something went wrong"})
    }

})

router.post("/server/auth/connectedArmClient",verifyFleetServerPassword, verifyArmPassword, async(req, res) =>
{
    const findArm = await Arm.findOne({id: req.body.id}); 
    if(!findArm)  return res.status(400).send({error:true,message:"Something went wrong"});
    
    if(findArm.connected) return res.status(400).send({error:true, message:"Arm is already connected to a fleet server"});

    try
    {
        findArm.connected = true; 
        findArm.save();
        console.log("bruh")
        res.send({error:false, message:"Success"})
    }
    catch(e)
    {
        
        res.status(400).send({error:true, message:"Something went wrong"})
    }

})


router.post("/server/auth/disconnectFleet",verifyFleetServerPassword, async(req, res) =>
{
    console.log(req.body.delete)
    const basedString = req.body.delete;
    const armUsers = basedString.split(",");
    for(let i = 0; i < armUsers.length-1; i++)
    {
        
        
        try{
            console.log(armUsers[i]);
            const arm = await Arm.findOne({id: armUsers[i]});
            arm.connected = false;
            arm.save(); 
        }
        catch(e)
        {
            console.log(e);
        }
    }
    const unchnagedIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let ip;
    for(let i = 0; i < unchnagedIp.length; i++)
    {
        if(isNumber(unchnagedIp[i]))
        {
            ip=unchnagedIp.slice(i,unchnagedIp.length);
            break;
        }

    }
    const fleets = db.getData("/fleetServers");
    for(let i = 0; i < fleets.length; i++)
    {
        if(ip === fleets[i].ip)
        {
            fleets[i].active = false;
            break; 
        }
    }
    console.log(fleets)
    db.push("/fleetServers",fleets)
    
    res.send({error:false, message:"success"});
})

router.post("/server/auth/connectedClient", verifyUserToken, async(req, res)=>
{
    const getAccount = await User.findOne({_id: req.user._id}); 
    if(!getAccount) return res.status(400).send({error:true,message:"Something went wrong"});

   res.send({error:false,message:"Something went wrong"}); 
})

module.exports = router; 