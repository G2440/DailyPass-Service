const mongoose = require("mongoose");

var dpSchema = new mongoose.Schema({
    _id : String,
    content : [
    {
        _id: String,
        NumChapUn : Number,
        Addedon: {type: Date , default: Date.now()}
    }
]
});

module.exports = mongoose.model("DP",dpSchema);

