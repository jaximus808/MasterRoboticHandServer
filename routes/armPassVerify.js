module.exports = (req, res, next) =>
{
    const pass = req.body.pass;
    if(!pass) return res.status(400).send({error: true})
    if(pass == process.env.ARM_PASSWORD)
    {
        next();
    }
    else 
    {
        res.status(400).send({error: true})
    }
} 