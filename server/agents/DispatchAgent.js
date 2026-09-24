const AgentEngine = require('./AgentEngine');

const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Telemetry = require('../models/Telemetry');
const Notification = require('../models/Notification');


class DispatchAgent extends AgentEngine {

    constructor() {

        super('dispatch');

    }



    async run(inputData, triggeredBy) {


        await this.initialize(
            inputData,
            triggeredBy
        );


        try {


            await this.think(
                'init',
                'Dispatch Agent activated. Starting fleet operation analysis...'
            );



            // VEHICLE ANALYSIS

            await this.think(
                'vehicle_scan',
                'Analyzing vehicle availability and status...'
            );


            const vehicles = await Vehicle.find()
            .populate(
                'assignedDriver',
                'fullName email status isActive'
            );


            const totalVehicles = vehicles.length;



            if(totalVehicles === 0){


                await this.complete(

                    'No vehicles available',

                    'Add vehicles to start fleet operations',

                    0

                );


                return;

            }




            const activeVehicles =
            vehicles.filter(
                v=>v.status==="active"
            );


            const maintenanceVehicles =
            vehicles.filter(
                v=>v.status==="maintenance"
            );


            const inactiveVehicles =
            vehicles.filter(
                v=>v.status==="inactive"
            );



            await this.think(

                'vehicle_status',

                `Total Vehicles: ${totalVehicles}. Active: ${activeVehicles.length}, Maintenance: ${maintenanceVehicles.length}, Inactive: ${inactiveVehicles.length}`

            );





            // DRIVER ANALYSIS


            await this.think(
                'driver_analysis',
                'Checking driver availability and workload...'
            );


            const drivers = await User.find({

                role:'driver',

                isActive:true

            });



            const workingDrivers =
            drivers.filter(
                d=>d.status==="working"
            );



            await this.think(

                'driver_status',

                `Active Drivers: ${drivers.length}. Currently Working: ${workingDrivers.length}`

            );







            // TRIP ANALYSIS


            await this.think(

                'trip_analysis',

                'Analyzing current trip operations...'

            );



            const activeTrips = await Trip.find({

                status:{
                    $in:[
                        "Assigned",
                        "Accepted"
                    ]
                }

            })
            .populate('driver vehicle');




            const completedTrips = await Trip.find({

                status:"Completed"

            });



            await this.think(

                'trip_status',

                `Active Trips: ${activeTrips.length}. Completed Trips: ${completedTrips.length}`

            );







            // DRIVER WORKLOAD CHECK


            let overloadedDrivers=[];



            drivers.forEach(driver=>{


                const driverTrips =
                activeTrips.filter(

                    trip =>
                    trip.driver &&
                    trip.driver._id.toString()
                    ===
                    driver._id.toString()

                );



                if(driverTrips.length >=3){


                    overloadedDrivers.push(

                        `${driver.fullName} has ${driverTrips.length} active trips`

                    );


                }


            });





            if(overloadedDrivers.length>0){


                await this.think(

                    'driver_overload',

                    `Driver workload issues detected: ${overloadedDrivers.join(', ')}`

                );


            }







            // TELEMETRY CHECK


            await this.think(

                'telemetry',

                'Checking vehicle tracking availability...'

            );



            let telemetryIssues=[];



            for(const vehicle of activeVehicles){


                const latest =
                await Telemetry.findOne({

                    vehicle:vehicle._id

                })
                .sort({

                    timestamp:-1

                });



                if(!latest){


                    telemetryIssues.push(

                        vehicle.licensePlate

                    );


                }


            }




            if(telemetryIssues.length>0){


                await this.think(

                    'telemetry_issue',

                    `${telemetryIssues.length} vehicles missing telemetry data`

                );


            }







            // FINAL DECISION


            let issues=[];



            if(maintenanceVehicles.length>0){

                issues.push(

                    `${maintenanceVehicles.length} vehicle(s) under maintenance`

                );

            }



            if(inactiveVehicles.length>0){

                issues.push(

                    `${inactiveVehicles.length} inactive vehicle(s)`

                );

            }



            if(overloadedDrivers.length>0){

                issues.push(

                    "Driver workload imbalance detected"

                );

            }



            if(telemetryIssues.length>0){

                issues.push(

                    "Telemetry gaps detected"

                );

            }




            let decision;


            if(issues.length===0){


                decision =
                "Fleet operations are healthy. Vehicles, drivers and trips are operating normally.";


            }
            else{


                decision =
                "Fleet requires attention. Operational issues detected.";


            }






            const recommendation =


            `Dispatch Summary:
            
            ${activeVehicles.length}/${totalVehicles} vehicles active.
            
            ${activeTrips.length} active trip(s).
            
            ${workingDrivers.length} driver(s) currently working.
            
            ${
                issues.length>0
                ?
                "Action Required: "+issues.join(". ")
                :
                "No immediate action required."
            }`;







            // ADMIN ALERT


            if(
                issues.length>0 &&
                triggeredBy
            ){


                const admins =
                await User.find({

                    role:"admin"

                });



                await Notification.insertMany(

                    admins.map(admin=>({


                        recipient:admin._id,

                        type:"ai_alert",

                        title:"Dispatch Agent Alert",

                        message:recommendation,

                        priority:"high"


                    }))

                );


            }







            await this.think(

                'complete',

                'Dispatch analysis completed successfully.'

            );



            await this.complete(

                decision,

                recommendation,

                issues.length>0 ? 92 : 90

            );




        }
        catch(error){


            console.log(
                "DISPATCH AGENT ERROR:",
                error
            );


            await this.fail(

                error.message

            );


        }



    }


}



module.exports = DispatchAgent;