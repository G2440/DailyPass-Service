const express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    axios = require("axios");
const { response } = require("express");

require("dotenv").config();
var DP = require("./model");
app.use(bodyParser.json());

const db = "mongodb+srv://" + process.env.USER + ":" + process.env.PASS + "@dailypass.tgaj4.mongodb.net/" + process.env.DB + "?retryWrites=true&w=majority";

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connection to Daily Pass Database Established');
}).catch((err) => {
    console.log('Cannot connect to the Database');
    console.log(err);
});

app.post("/add/:id/:id1/:num", (req, res) => {
    var newObj = {
        _id: req.params.id1,
        NumChapUn: req.params.num
    };
    DP.findByIdAndUpdate(
        req.params.id,
        { $push: { content: newObj } },
        { safe: true, upsert: true, new: true },
        function (err, model) {
            console.log(model);
        }
    );

})
app.post("/systemUnlock/:id", (req, res) => {
    var obj = {
        _id: req.params.id,
        content: []
    }
    axios.get("http://localhost:8001/allSeries").then((response) => {
        res.send((response.data));
        for (var i = 0; i < response.data.length; i++) {
            var obj1 = {
                _id: response.data[i]._id,
                NumChapUn: 4
            }
            obj.content.push(obj1);
        }
        var add = new DP(obj);
        add.save().then(() => {
            console.log("Unlocked");
        }).catch((err) => {
            if (err) throw err;
        })

    })

});

app.get("/dailydata/:id", (req, res) => {
    DP.findById(req.params.id).then((user) => {
        if (user) res.json(user);
        else res.sendStatus(404);
    }).catch(err => {
        if (err) throw err;
    })
})
app.post("/userAdd", (req, res) => {
    var newuserCon = req.body;
    var s = new DP(newuserCon);
    s.save().then(() => {
        console.log("Added To the DB");
    }).catch((err) => {
        if (err){
        console.log("Error in Adding to DB");
        console.log(err);
        }
    })
})

app.get("/all", (req, res) => {
    DP.find({}, function (err, dt) {
        if (err) {
            console.log("Error in fetching all the Data");
            console.log(err);
        }else res.json(dt);
    })
})

app.get("/unlock/:id/:id1", (req, res) => {

    DP.find({ _id: req.params.id, "content._id": req.params.id1 }, function (err, docs) {
        
        DP.findById(req.params.id , (err,ddata)=>{
            if(err)
            console.log(err);
            else{
                var val =0;
                for(var i =0 ; i < ddata.content.length ; i++){
                    if(ddata.content[i]._id == req.params.id1){
                    val = ddata.content[i].NumChapUn;
                    break;
                    }
                }
                DP.findOneAndUpdate({ _id: req.params.id, "content._id": req.params.id1 }, { "content.$.NumChapUn": val + 1 }, { new: true }, (err, doc) => {
                    if (err) {
                        console.log(err);
                    }
                    res.send(doc);
                });        
            }
        })

    });
})

app.get("/scheduledUnlock", (req, res) => {
    DP.find({}, function (err, doc) {
        if (err) console.log(err);
        else {
            for (var i = 0; i < doc.length; i++) {
                var dataObj = {
                    id: doc[i]._id,
                    content: doc[i].content
                }
                axios.get("https://pratilipi-microservices.herokuapp.com/userService/user/" + dataObj.id).then((response) => {
                    var extract = response.data.createdAt;
                    var userDate = new Date(extract);
                    var contDate;
                    var time;
                    var dayTime;
                    var finVal;
                    for (var j = 0; j < dataObj.content.length; j++) {
                        contDate = new Date(dataObj.content[j].Addedon);
                        time = Math.abs(contDate.getTime() - userDate.getTime());
                        dayTime = time / (1000 * 3600 * 24)
                        var finVal = Math.floor(dayTime);
                        if (finVal > 0) {
                            var val = 4 + finVal;
                           
                            DP.findOneAndUpdate({ _id: response.data._id, "content._id": dataObj.content[j]._id }, { "content.$.NumChapUn": val }, { new: true }, (err, doc) => {
                                if (err) {
                                    console.log(err);
                                }
                                
                            });
                        }
                    }


                })
            }
        }
    })
})


app.get("/daily/:id", (req, res) => {
    axios.get("http://localhost:8002/scheduledUnlock");

    DP.findById(req.params.id, async (err, doc) => {
        for (var i = 0; i < doc.content.length; i++) {
            var unC = {
                data: doc.content[i]
            }

            await axios.get("http://localhost:8001/pickcontent/" + doc.content[i]._id).then((response) => {
                res.write("Name of the Series  : " + response.data.bookName);
            })
            res.write("Number of Chapters Unlocked " + unC.data.NumChapUn)
        }
        res.end();
    })

})


app.listen(process.env.PORT||8002, () => {
    console.log("Started");
});
