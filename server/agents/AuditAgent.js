const AgentEngine = require('./AgentEngine');

const FuelLedger = require('../models/FuelLedger');
const User = require('../models/User');
const Notification = require('../models/Notification');


class AuditAgent extends AgentEngine {

  constructor() {
    super('audit');
  }


  async run(inputData, triggeredBy) {

    await this.initialize(inputData, triggeredBy);


    try {


      await this.think(
        'init',
        'Audit Agent activated. Starting intelligent fuel ledger audit.'
      );



      const entries = await FuelLedger.find()
        .populate(
          'vehicle',
          'make model licensePlate fuelType'
        )
        .populate(
          'driver',
          'fullName email'
        );



      await this.think(
        'data_loading',
        `Loaded ${entries.length} fuel records from database.`
      );



      if(entries.length === 0){

        await this.complete(
          'No fuel records available.',
          'Waiting for driver fuel submissions.',
          0
        );

        return;

      }




      // ---------------------------
      // BASIC CALCULATION
      // ---------------------------


      const totalCost = entries.reduce(
        (sum,e)=>sum + Number(e.fuelCost || 0),
        0
      );


      const totalQuantity = entries.reduce(
        (sum,e)=>sum + Number(e.fuelQuantity || 0),
        0
      );



      const averagePrice =
        totalQuantity > 0
        ?
        totalCost / totalQuantity
        :
        0;



      await this.think(
        'cost_analysis',
        `Total Spending: ₹${totalCost.toFixed(2)} | Quantity: ${totalQuantity.toFixed(2)}L | Average Price/L: ₹${averagePrice.toFixed(2)}`
      );





      // ---------------------------
      // PRICE ANOMALY DETECTION
      // ---------------------------


      await this.think(
        'price_analysis',
        'Analyzing fuel price spikes and unusual entries.'
      );



      const priceList = entries.map(e=>{

        return Number(
          e.pricePerUnit ||
          (e.fuelCost / e.fuelQuantity)
        );

      }).filter(p=>p>0);



      const average =
      priceList.reduce((a,b)=>a+b,0)
      /
      priceList.length;



      const highPriceLimit =
      average * 1.25;



      const priceAnomalies =
      entries.filter(e=>{

        const price =
        Number(
          e.pricePerUnit ||
          (e.fuelCost/e.fuelQuantity)
        );


        return price > highPriceLimit;

      });



      await this.think(
        'price_result',
        `${priceAnomalies.length} fuel entries detected above normal price range.`
      );






      // ---------------------------
      // FUEL TYPE VALIDATION
      // ---------------------------


      await this.think(
        'fuel_validation',
        'Checking fuel type compatibility with vehicles.'
      );



      let fuelMismatch = [];



      entries.forEach(e=>{


        const vehicleFuel =
        e.vehicle?.fuelType?.toLowerCase();


        const enteredFuel =
        e.fuelType?.toLowerCase();



        if(
          vehicleFuel &&
          enteredFuel &&
          vehicleFuel !== enteredFuel
        ){

          fuelMismatch.push(e);

        }


      });



      await this.think(
        'fuel_validation_result',
        `${fuelMismatch.length} fuel type mismatch records found.`
      );






      // ---------------------------
      // DRIVER ANALYSIS
      // ---------------------------


      await this.think(
        'driver_analysis',
        'Analyzing driver fuel spending behaviour.'
      );



      const driverMap = {};



      entries.forEach(e=>{


        if(!e.driver) return;


        const id = e.driver._id.toString();


        if(!driverMap[id]){

          driverMap[id]={
            name:e.driver.fullName,
            cost:0,
            quantity:0,
            count:0
          };

        }


        driverMap[id].cost += Number(e.fuelCost);
        driverMap[id].quantity += Number(e.fuelQuantity);
        driverMap[id].count++;

      });



      const drivers =
      Object.values(driverMap)
      .sort((a,b)=>b.cost-a.cost);



      if(drivers.length){

        const top = drivers[0];


        await this.think(
          'top_driver',
          `Highest fuel spending driver: ${top.name} - ₹${top.cost.toFixed(2)}`
        );

      }






      // ---------------------------
      // MONTHLY TREND
      // ---------------------------


      const monthly = {};



      entries.forEach(e=>{


        const date = new Date(e.date);


        const key =
        `${date.getFullYear()}-${date.getMonth()+1}`;



        monthly[key] =
        (monthly[key] || 0)
        +
        Number(e.fuelCost);



      });



      const months =
      Object.keys(monthly)
      .sort();



      if(months.length>=2){


        const current =
        monthly[months.at(-1)];


        const previous =
        monthly[months.at(-2)];



        if(previous>0){


          const change =
          ((current-previous)/previous)*100;



          await this.think(
            'monthly_trend',
            `Fuel spending changed ${change.toFixed(1)}% compared to previous month.`
          );


        }

      }







      // ---------------------------
      // SAVE AI FLAGS
      // ---------------------------


      for(const item of priceAnomalies){


        await FuelLedger.findByIdAndUpdate(
          item._id,
          {
            aiAnalyzed:true,
            aiFlag:
            'High fuel price detected - Review required'
          }
        );

      }



      for(const item of fuelMismatch){


        await FuelLedger.findByIdAndUpdate(
          item._id,
          {
            aiAnalyzed:true,
            aiFlag:
            'Fuel type mismatch detected'
          }
        );


      }






      // ---------------------------
      // FINAL DECISION
      // ---------------------------



      const issues=[];



      if(priceAnomalies.length)
      issues.push(
        `${priceAnomalies.length} price anomaly`
      );



      if(fuelMismatch.length)
      issues.push(
        `${fuelMismatch.length} fuel mismatch`
      );





      const decision =
      issues.length

      ?

      `Audit detected issues: ${issues.join(', ')}`

      :

      'Fuel ledger audit completed. No abnormal activity detected.';






      const recommendation =

      `Analyzed ${entries.length} records. Total spending ₹${totalCost.toFixed(2)}. ` +

      (

      issues.length

      ?

      `Admin review required for ${issues.join(' and ')}.`

      :

      'Fuel expenses are within normal operating range.'

      );







      if(
        issues.length &&
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

            title:'Audit Agent Alert',

            message:decision,

            priority:'high'

          }))

        );


      }





      await this.think(
        'complete',
        'Audit analysis completed successfully.'
      );



      await this.complete(
        decision,
        recommendation,
        94
      );



    }

    catch(error){


      await this.fail(
        error.message
      );


    }


  }


}


module.exports = AuditAgent;