const jwt = require("jsonwebtoken");

const db = require("../dbConnectExec.js");
const databaseConfig = require("../config.js")

const auth = async(req,res, next)=>{
    // console.log("in the middleware", req.header("Authorization"));
    // next();

    try{
        //1. decode token

        let myToken = req.header("Authorization").replace("Bearer ","");
        // console.log("token", myToken);

        let decoded = jwt.verify(myToken, databaseConfig.JWT);
        console.log(decoded);

        let personPK = decoded.pk;

        //2. compare token with database
        let query = `SELECT PersonPK, firstName, lastName, email
        FROM Person
        WHERE PersonPK=${personPK} and token = '${myToken}'`;

        let returnedUser = await db.executeQuery(query);
        //console.log("returned user", returnedUser);

        //3. save user information in the request
        if(returnedUser[0][0]){
            req.contact = returnedUser[0][0];
            next();
        }
        else{
            return res.status(401).send("Invalid credentials");
        }
    }
    catch(err){
        console.log(err);
        return res.status(401).send("Invalid credentials");
    }
  }

  module.exports = auth;