const router = require("express").Router();
const User = require("./models/UserObject");
const Arm = require("./models/ArmObject");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {registerValidation, loginValidation }= require("./validation")
const verifyUserToken = require("./userTokenVerify")
const verifyArmPassword = require("./armPassVerify")
router.get("/test", (req, res) =>
{
    console.log("cock")
    res.send("receive ");
})
router.post("/test", (req, res)=>
{
    console.log("dog");
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

router.post("/api/arm/register", verifyArmPassword, async(req, res)=>
{
    let ip = req.body.ip;
    const splitIp = ip.split(".");
    if(splitIp.length != 4) return res.status(400).send({error:true});
    for(let i = 0; i < 4; i++)
    {
        if(parseInt(splitIp[i]) <= 255 || parseInt(splitIp[i]) >= 0 ) return res.status(400).send({error:true})
    }
    if(parseInt(req.body.port) < 0) return res.status(400).send({error:true});
    const arm = new Arm(
        {
            id: req.body.id,
            ip: req.body.ip, 
            password: req.body.password,
            port: req.body.port
        }
    )

    try
    {
        await arm.save()
        res.send(200).send({error:false})
    }
    catch
    {
        res.send(400).send({error:true})
    }
})

module.exports = router; 