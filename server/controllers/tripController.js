const Trip = require("../models/Trip");
const User=require("../models/User");


exports.acceptTrip = async(req,res)=>{

try{

const trip = await Trip.findByIdAndUpdate(
req.params.id,
{
status:"Accepted"
},
{
new:true
}
);


// Driver status update

await User.findByIdAndUpdate(
trip.driver,
{
status:"working"
}
);


res.json({

message:"Trip Accepted",

trip

});


}
catch(error){

res.status(500).json({

message:error.message

});

}

};

// Assign Trip
exports.assignTrip = async (req, res) => {

    try {

        console.log("RECEIVED TRIP:", req.body);

        const trip = new Trip(req.body);

        await trip.save();


        res.status(201).json({
            message: "Trip Assigned Successfully",
            trip
        });


    } catch (error) {

        console.log("TRIP ERROR:", error);

        res.status(500).json({
            message: error.message
        });

    }

};



// Get Driver Trips
exports.getDriverTrips = async (req, res) => {

    try {

        const trips = await Trip.find({
            driver: req.params.id
        })
        .populate("vehicle")
        .populate("driver");


        res.json(trips);


    } catch (error) {

        console.log("GET TRIP ERROR:", error);

        res.status(500).json({
            message: error.message
        });

    }

};

exports.declineTrip = async (req,res)=>{

try{

const trip = await Trip.findByIdAndUpdate(

req.params.id,

{
status:"Declined"
},

{
new:true
}

);

res.json({

message:"Trip Declined",

trip

});

}
catch(error){

res.status(500).json({

message:error.message

});

}

};

exports.completeTrip = async (req,res)=>{

try{

const trip = await Trip.findByIdAndUpdate(

req.params.id,

{
status:"Completed",
completedAt:new Date()
},

{
new:true
}

);


if(!trip){

return res.status(404).json({
message:"Trip not found"
});

}

// Driver status update
await User.findByIdAndUpdate(
trip.driver,
{
status:"active"
}
);

res.json({

message:"Trip Completed",

trip

});


}
catch(error){

res.status(500).json({

message:error.message

});

}

};

// Get All Trips (Admin)

exports.getAllTrips = async(req,res)=>{

try{

const trips = await Trip.find()
.populate("driver")
.populate("vehicle")
.sort({createdAt:-1});


res.json(trips);


}
catch(error){

res.status(500).json({
message:error.message
});

}

};