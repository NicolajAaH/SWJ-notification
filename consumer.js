const {ServiceBusClient} = require('@azure/service-bus');
const {SecretClient} = require("@azure/keyvault-secrets");
const {DefaultAzureCredential} = require("@azure/identity");
var nodemailer = require('nodemailer');


require('dotenv').config();

/**
 * To be used if the service is deployed on Azure Function
 */

/*var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'youremail@gmail.com',
      pass: 'yourpassword'
    }
  });
  */

async function sendMail(email, text){
    /*var mailOptions = {
        from: 'youremail@gmail.com', //TODO: change to actual email
        to: email,
        subject: 'New job posted',
        text: "New job has been posted: " + text
      };
   

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
         */
}

async function main() {
  console.log(`New job: ${brokeredMessage.body}`);
  await sendMail('email', brokeredMessage.body.text); //TODO: change to actual email - email set to temporary email for testing
}

module.exports = main;