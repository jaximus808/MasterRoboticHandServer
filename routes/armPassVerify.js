module.exports = (req, res, next) =>
{
    const pass = req.body.pass;
    console.log(req.body)
    if(!pass) return res.status(400).send({error: true,existing:false })
    if(pass == process.env.ARM_PASSWORD)
    {
        next();
    }
    else 
    {
        res.status(400).send({error: true})
    }
} 