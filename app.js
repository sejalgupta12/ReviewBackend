const nodemailer = require('nodemailer');
const OAuth2 = require('OAuth2');
const express = require('express');
const logger = require('morgan');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017';

let DB;


MongoClient.connect(url, function(err, client) {

    console.log(err)

    DB = client.db("Review");

})


app.use(logger());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));



app.use(session({
    secret: 'drtfgyuhinjbjbihivvugugugugchvnsae623e5',
    saveUninitialized :false,
    resave:false,
}));



var sess;
// app.get('/', function(req, res) {
//     sess = req.session;

//     if (sess.email) {
//         res.redirect('/dashboard');
//     } else {
//         res.redirect('/login');
//     }

// })


app.post("/register", function(req, res) {
    let task = req.body;

    var query = { email: task.email };
    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;

        if (!result.length) {
            DB.collection("user").insertOne(task, function(err, r) {
                res.json(r);
            })
        } else console.log("Email id already registered");


    });





})




app.post("/login", function(req, res) {

    let detail = req.body;

    
    var query = { email: detail.email, password: detail.password, flag: "true" };
    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;

        if (result.length) {
       
            sess= detail.email;
            req.session.email= detail.email;
            req.session.save();
            console.log("logging you in");
            console.log(req.session.email);

            res.json(req.session.email);

        } 
        else
            console.log("Invalid User");


    });

})

app.post("/data",function(req,res){

    if(sess){

        
    res.json({
        status:true, 
        email:sess
      })
    }
    else{
        res.json({
            status:false
        })
        return
    }

})

app.post("/isloggedin",function(req,res){
    res.json({
        status:!!sess
    })
})

app.post("/logout", function(req, res) {

    
    console.log(sess);

    req.session.destroy(function(err) {
        if (err) {

            console.log(err);
        } else {
            // res.redirect('./');
            res.json("logout");
        }
    });
})




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'sejalgupta218@gmail.com',
        clientId: '918216903443-4b9j06fdg4gkg7qevi5ti679osdde5pf.apps.googleusercontent.com',
        clientSecret: 'BkvKe1nGElyewerM7gXERKa-',
        refreshToken: '1/0n0j7L8dTqWyf5aO4ZiHpQH-R_wqoz0tibVIdn4JLCk',
        accessToken: 'ya29.GlvsBaj4r0d-RSiw6nrInfenX-7dKptMuovkjhPCQ7OTRrkZjR5GJEy6V3pBS9l2pmItTz3E0xRf68osQfUTNfFMz5WnU57A5GMu5g1m8nnXw-mWGRYCFo5ziHQa'
    },
    tls: {
        rejectUnauthorized: false
    }
});






app.post('/send', function(req, res) {
    console.log("Send api called");
    rand = Math.floor((Math.random() * 100) + 54);
    host = req.get('host');
    link = "http://" + req.get('host') + "/verify?id=" + rand;
    mailOptions = {
        to: req.body.email,
        subject: "Please confirm your Email account",
        html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
    }
    console.log(mailOptions);
    transporter.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            console.log("Message sent: " + response.message);
            res.json("sent");
        }
    });
});


app.get('/verify', function(req, res) {
    console.log(req.protocol + ":/" + req.get('host'));
    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
        console.log("Domain is matched. Information is from Authentic email");
        if (req.query.id == rand) {
            console.log("email is verified");

            var myquery = { "email": mailOptions.to };
            console.log("email id from verify :" + myquery.email);
            var newvalues = { $set: { "flag": "true" } };

            DB.collection("user").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
                //console.log(res);

            });


            res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
            res.redirect('login');
            res.render('login');
        } else {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    } else {
        res.end("<h1>Request is from unknown source");
    }
});





app.post('/fsend', function(req, res) {

    var query = { email: req.body.email };



    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;

        if (result.length) {

         //  host = req.get('host');
            link = "http://localhost:4200/reset-pass/"
            mailOptions = {
                    to: req.body.email,
                    subject: "Reset password",
                    html: "Hello,<br> Please Click on the link to change your password.<br><a href=" + link + ">Click here to Change</a>"
                }
                // console.log(mailOptions);
            transporter.sendMail(mailOptions, function(error, response) {
                if (error) {
                    console.log(error);
                    res.end("error");
                } else {
                    console.log("Message sent: " + response.message);
                    res.json("sent");
                }
            });


        } else 
        {
            res.json("notSent")
            console.log("Email id not  registered");
        }

    });


});










app.post('/business', function(req, res) {


    DB.collection("user").find({},{ _id: 0, password: 0, flag: 0 }).toArray(function(err, result) {
        if (err) throw err;


 console.log(result);
        res.send(result);

    });

})



app.post("/rate", function(req, res) {
 
    let ratee = req.body;

           var query = { bname: ratee.bname };

           console.log(ratee.bname);
           
            
     console.log("rate5:"+ratee.rate5);
     console.log("rate4:"+ratee.rate4);
     console.log("rate3:"+ratee.rate3);
     console.log("rate2:"+ratee.rate2);
     console.log("rate1:"+ratee.rate1);

            
        
           

    DB.collection("starrate").find(query).toArray(function(err, result) {
        if (err) throw err;

        console.log(result);
        console.log("rttt"+result.length+"rttt");

        if (!result.length) {

           
             DB.collection("starrate").insertOne(ratee, function(err, r) {
                res.json(r);
            })

        } else {


            var myquery = {bname:ratee.bname };

    var newvalues = { $inc: {rate5:ratee.rate5, rate4:ratee.rate4,rate3:ratee.rate3,rate2:ratee.rate2,rate1:ratee.rate1 } };

            DB.collection("starrate").updateOne(myquery, newvalues, function(err, res) {
              if (err) throw err;
              console.log("1 document updated");
            
            });



        }


    });



        })




        
app.post("/resetPass", function(req, res) {

    

        
        var myquery   = { email:req.body.email };

        var newvalues = { $set: { "password": req.body.password } };
    
                DB.collection("user").updateOne(myquery, newvalues, function(err, res) {
                  if (err) throw err;
                  console.log("1 document updated");
                
                });
    


        console.log(rest);
        res.send(res);

        });


        

app.post('/graph', function(req, res) {



    DB.collection("starrate").find().toArray(function(err, result) {
        if (err) throw err;


        console.log(result);
        res.send(result);

    });

})





app.listen(8080, function() {
    console.log("server started");
});