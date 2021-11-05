const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // add

const db = require("./dbConnectExec.js");
const databaseConfig = require("./config.js"); // add

const app = express();
app.use(express.json());

app.listen(5000, () => {
  console.log(`app is running on port 5000`);
});

app.get("/", (req, res) => {
  res.send("API is running!");
});


app.post("/person/login", async (req, res) => {
  // console.log("/person/login called", req.body);

  //1. data validation
  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Bad request");
  }

  //2. check that user exists in DB

  let query = `SELECT *
  FROM Person
  WHERE email = '${email}'`;

  let result;
  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /person/login", myError);
    return res.status(500).send();
  }

   //console.log("result", result[0][0]);

  if (!result[0][0]) {
    return res.status(401).send("Invalid user credentials");
  }

  //3. check password
  let user = result[0][0];

  if (!bcrypt.compareSync(password, user.password)) {
    console.log("invalid password");
    return res.status(401).send("Invalid user credentials");
  }

  //4. generate token

  let token = jwt.sign({ pk: user.PersonPK }, databaseConfig.JWT, {
    expiresIn: "60 minutes",
  });
   console.log("token", token);

  //5. save token in DB and send response

  let setTokenQuery = `UPDATE Person
  SET token = '${token}'
  WHERE PersonPK = ${user.PersonPK}`;

  try {
    await db.executeQuery(setTokenQuery);

    res.status(200).send({
      token: token,
      user: {
        NameFirst: user.firstName,
        NameLast: user.lastName,
        Username: user.username,
        Email: user.email,
        PersonPK: user.PersonPK,
      },
    });
  } catch (myError) {
    console.log("error in setting user token", myError);
    res.status(500).send();
  }
});

// Signup Route
app.post("/person", async (req, res) => {
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;


  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).send("Bad request");
  }

  firstName = firstName.replace("'", "''");
  lastName = lastName.replace("'", "''");
  username = username.replace("'", "''");

  let emailCheckQuery = `SELECT email
  FROM Person
  WHERE email = '${email}'`;

  let existingUser = await db.executeQuery(emailCheckQuery);
  console.log("existing user", existingUser);

  if (existingUser[0][0]) {
    return res.status(409).send("Duplicate email");
  }
console.log("reaching?")
  let hashedPassword = bcrypt.hashSync(password);

  let insertQuery = `INSERT INTO Person(firstName, lastName, username, email, password)
VALUES('${firstName}','${lastName}', '${username}', '${email}','${hashedPassword}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /person", err);
      res.status(500).send();
    });
});

//Route 1
app.get("/pictures", (req, res) => {
  //get data from the database
  db.executeQuery(
    `SELECT *
    FROM Picture
    LEFT JOIN SocialMediaPost
    ON SocialMediaPost.PostPK = Picture.PostFK
    ORDER BY PicturePK;`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      //console.log(myError);
      res.status(500).send();
    });
});

app.get("/picture/:pk", (req, res) => {
  let pk = req.params.pk;

  //console.log(pk);
  let myQuery = `SELECT *
  FROM Picture
  LEFT JOIN SocialMediaPost
  ON SocialMediaPost.PostPK = Picture.PostFK
  WHERE PicturePK = ${pk};`;

  db.executeQuery(myQuery)
    .then((result) => {
      //console.log("result", result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send(`bad request`);
      }
    })
    .catch((err) => {
      console.log("Error in /social/:pk", err);
      res.status(500).send();
    });
});
