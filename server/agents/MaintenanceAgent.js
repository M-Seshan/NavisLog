const AgentEngine = require('./AgentEngine');

const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Notification = require('../models/Notification');


class MaintenanceAgent extends AgentEngine {


  constructor() {

    super('maintenance');

  }



  async run(inputData, triggeredBy) {


    await this.initialize(
      inputData,
      triggeredBy
    );



    try {


      await this.think(
        'init',
        'Maintenance Agent activated. Starting fleet health analysis.'
      );





      // LOAD OPEN ISSUES

      const issues =
      await Maintenance.find({

        status:{
          $in:[
            'reported',
            'acknowledged',
            'in_progress'
          ]
        }

      })
      .populate(
        'vehicle',
        'make model licensePlate status currentOdometer nextServiceDue'
      )
      .populate(
        'reportedBy',
        'fullName'
      );





      await this.think(
        'issue_scan',
        `${issues.length} active maintenance issue(s) detected.`
      );





      if(issues.length===0){


        await this.think(
          'healthy',
          'No active maintenance problems found.'
        );


        await this.complete(

          'Fleet maintenance status is healthy.',

          'Continue scheduled inspections and preventive maintenance.',

          95

        );


        return;

      }






      // SEVERITY ANALYSIS


      const critical =
      issues.filter(
        i=>i.severity==='critical'
      );


      const high =
      issues.filter(
        i=>i.severity==='high'
      );


      const medium =
      issues.filter(
        i=>i.severity==='medium'
      );


      const low =
      issues.filter(
        i=>i.severity==='low'
      );




      await this.think(

        'severity_analysis',

        `Critical: ${critical.length} | High: ${high.length} | Medium: ${medium.length} | Low: ${low.length}`

      );







      // VEHICLE HEALTH CHECK


      await this.think(

        'vehicle_health',

        'Calculating vehicle maintenance risk levels.'

      );



      const riskyVehicles=[];



      for(const issue of issues){


        if(
          issue.vehicle &&
          (
            issue.severity==='critical' ||
            issue.severity==='high'
          )
        ){


          riskyVehicles.push(issue.vehicle);



          await Vehicle.findByIdAndUpdate(

            issue.vehicle._id,

            {
              status:'maintenance'
            }

          );


        }


      }






      await this.think(

        'risk_result',

        `${riskyVehicles.length} vehicle(s) marked as maintenance risk.`

      );









      // SERVICE DUE ANALYSIS


      await this.think(

        'service_check',

        'Checking scheduled service requirements.'

      );



      const vehicles =
      await Vehicle.find();



      const overdue=[];



      vehicles.forEach(v=>{


        if(

          v.nextServiceDue &&
          v.currentOdometer >= v.nextServiceDue

        ){


          overdue.push({

            vehicle:

            `${v.make} ${v.model} (${v.licensePlate})`,

            km:

            v.currentOdometer-v.nextServiceDue

          });


        }


      });





      if(overdue.length){


        await this.think(

          'service_overdue',

          `${overdue.length} vehicle(s) exceeded service interval.`

        );


      }

      else{


        await this.think(

          'service_ok',

          'All vehicles are within service schedule.'

        );


      }









      // MAINTENANCE HISTORY ANALYSIS


      await this.think(

        'history',

        'Analyzing previous maintenance patterns.'

      );



      const history =
      await Maintenance.find({

        status:'resolved'

      });



      const issueCount={};



      history.forEach(h=>{


        issueCount[h.issueType] =
        (issueCount[h.issueType] || 0)+1;


      });




      const commonIssue =
      Object.entries(issueCount)
      .sort(
        (a,b)=>b[1]-a[1]
      )[0];





      if(commonIssue){


        await this.think(

          'pattern',

          `Most repeated issue: ${commonIssue[0]} (${commonIssue[1]} times).`

        );


      }









      // FINAL DECISION


      const problems=[];



      if(critical.length)

      problems.push(
        `${critical.length} critical issue(s)`
      );



      if(high.length)

      problems.push(
        `${high.length} high priority issue(s)`
      );



      if(overdue.length)

      problems.push(
        `${overdue.length} overdue service vehicle(s)`
      );





      const decision =

      problems.length

      ?

      `Maintenance risk detected: ${problems.join(', ')}.`

      :

      'Maintenance analysis completed. No major risks detected.';







      const recommendations=[];



      critical.forEach(i=>{


        recommendations.push(

          `🚨 ${i.vehicle?.licensePlate}: Immediate repair required for ${i.issueType}.`

        );


      });




      high.forEach(i=>{


        recommendations.push(

          `⚠️ ${i.vehicle?.licensePlate}: Schedule repair for ${i.issueType}.`

        );


      });




      overdue.forEach(v=>{


        recommendations.push(

          `🔧 ${v.vehicle}: Service overdue by ${v.km} km.`

        );


      });




      if(!recommendations.length){


        recommendations.push(

          'Continue preventive maintenance schedule.'

        );


      }






      const recommendation =
      recommendations.join(' | ');









      // ADMIN ALERT


      if(

        (critical.length || high.length || overdue.length)

        &&

        triggeredBy

      ){



        const admins =
        await User.find({

          role:'admin'

        });




        await Notification.insertMany(

          admins.map(a=>({

            recipient:a._id,

            type:'ai_alert',

            title:'Maintenance Agent Alert',

            message:decision,

            priority:

            critical.length

            ?

            'urgent'

            :

            'high'


          }))


        );



      }







      await this.think(

        'complete',

        'Maintenance intelligence analysis completed.'

      );





      await this.complete(

        decision,

        recommendation,

        93

      );




    }

    catch(error){


      await this.fail(

        error.message

      );


    }


  }


}


module.exports = MaintenanceAgent;