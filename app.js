const nodemailer = require('nodemailer');
const OAuth2 = require('OAuth2');
const express = require('express');
const logger = require('morgan');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
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
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });


app.use(session({
    secret: 'drtfgyuhinjbjbihivvugugugugchvnsae623e5',
    saveUninitialized :false,
    resave:false,
}));



var sess;

app.post("/register", function(req, res) {
    let task = req.body;

    var query = { email: task.email };
    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;

        if (result.length) {
            res.json("error");
            console.log("already");            
        } else {
            
            DB.collection("user").insertOne(task, function(err, r) {
                console.log("not already");
                res.json(r);
            })
        }
       
    });

})




app.post("/checkForRegister", function(req, res) {
    let task = req.body;
    var query = { "email": task.email };
   
    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;

        else if(result)
        res.json(result);

        else
             res.json("notregister");
       
    });

})





app.post("/login", function(req, res) {

    let detail = req.body;
    console.log(detail.email);
    console.log(detail.password);

    var query = { "email": detail.email, "pass": detail.password, "flag": "true" };

    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;

        console.log(result);
       if (result.length) {
       
       
            sess= detail.email;
            res.json(sess);

        } 
        else
           res.json("Invalid User");


    });

})

app.post("/data",function(req,res){

    if(sess){

        
    res.json([{
      
        email:sess
      }])
    }
    

})


app.post("/logout", function(req, res) {

    
    req.session.destroy(function(err) {
        if (err) {

            console.log(err);
        } else {
            
            res.json("logout");
        }
    });
})



app.post("/dashboardData", function(req, res) {
    var query = { "email": sess };

    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;


 console.log(result);
        res.send(result);

    });
    
    
})


app.post("/rateData", function(req, res) {
    
    var query = { "bname": req.body.bname };
    DB.collection("starrate").find(query).toArray(function(err, result) {
        if (err) throw err;
   
        res.send(result);

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
            var newvalues = { $set: { "flag": "true" } };

            DB.collection("user").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
              

            });

            rand1 = Math.floor((Math.random() * 1000) + 54);


            ownerlink = "http://localhost:4200/customerReview?q="+ rand1;


            var myquery   = { "email":mailOptions.to};

            var newvalues = { $set: { "rand": rand1 } };
        
                    DB.collection("user").updateOne(myquery, newvalues, function(err, res) {
                      if (err) throw err;
                      console.log("1 document updated");
                    
                    });
        




            res.end("<h1>Email:" + mailOptions.to + " is been Successfully verified.Link for Review of your site----><a href='#'>" + ownerlink + "</a></h1>");
            res.redirect('login');
            res.render('login');
        } else {
            
            res.end("<h1>Link is Expired</h1>");
        }
    } else {
        res.end("<h1>Invalid Request");
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
                    console.log("Message sent");
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


    var query = { rand: req.body.rand };

    DB.collection("user").find(query).toArray(function(err, result) {
        if (err) throw err;


 console.log(result);
        res.send(result);

    });

})



app.post("/rate", function(req, res) {
 
    let ratee = req.body;

           var query = { bname: ratee.bname };

           

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
 
        var myquery   = { "email":mailOptions.to};
        var newvalues = { $set: { "pass": req.body.password,"cpass":req.body.password } };
    
                DB.collection("user").updateOne(myquery, newvalues, function(err, result) {
                 
            res.json(result);

                });
    

       

        });


        

app.post('/graph', function(req, res) {


    let ratee = req.body;

    var query = { bname: ratee.bname };
    

    DB.collection("starrate").find(query).toArray(function(err, result) {
        if (err) console.log(err);

        res.json(result);

    });

})





app.listen(8080, function() {
    console.log("server started");
});