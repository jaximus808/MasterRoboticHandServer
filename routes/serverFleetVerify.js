module.exports = (req, res, next) =>
{
    const pass = req.body.fleetPass;
    console.log("fleetTest")
    console.log(pass)
    console.log(req.body)
    if(!pass) return res.status(400).send({error: true,message:"Something went wrong" });
    if(pass == process.env.FLEET_SERVER_PASSWORD)
    {
        next();
    }
    else 
    {
        res.status(400).send({error: true, message:"Fleet fail"})
    }
} 