const express=require("express");

const router=express.Router();

const {
assignTrip,
getDriverTrips,
getAllTrips,
acceptTrip,
declineTrip,
completeTrip
}=require("../controllers/tripController");

router.post(
"/assign",
assignTrip
);



router.get(
"/driver/:id",
getDriverTrips
);


router.put(
"/accept/:id",
acceptTrip
);

router.put(
"/decline/:id",
declineTrip
);

router.put("/complete/:id", completeTrip);

router.get(
"/",
getAllTrips
);

module.exports=router;