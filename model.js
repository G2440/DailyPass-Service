const mongoose = require("mongoose");

var dpSchema = new mongoose.Schema({
    _id : String,
    content : [
    {
        _id: String,
        NumChapUn : Number,
        uncCounter : {type : Number , default : 0},
        Addedon: {type: Date , default: Date.now()}
    }
]
});

module.exports = mongoose.model("DP",dpSchema);

