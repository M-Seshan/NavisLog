const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({

    driver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    vehicle:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Vehicle",
        required:true
    },

    pickupLocation:{
        type:String,
        required:true
    },

    dropLocation:{
        type:String,
        required:true
    },

    tripDate:{
        type:Date,
        default:Date.now
    },

   startDate: {
    type: Date,
    required: true
},

startTime: {
    type: String,
    required: true
},

endDate: {
    type: Date,
    required: false
},

endTime: {
    type: String,
    required: false
},

status: {
    type: String,
    default: "Assigned"
}

},{
    timestamps:true
});


module.exports = mongoose.model("Trip",tripSchema);