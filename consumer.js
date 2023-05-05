const {ServiceBusClient} = require('@azure/service-bus');
const {SecretClient} = require("@azure/keyvault-secrets");
const {DefaultAzureCredential} = require("@azure/identity");
var nodemailer = require('nodemailer');


require('dotenv').config();

const ServiceBusConfig = {
    NEW_JOB_TOPIC: 'new_job',
    NEW_JOB_SUBSCRIPTION: 'notificationservice',
};

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
    const credential = new DefaultAzureCredential();

    const keyVaultName = "job-boards-secret";
    const url = "https://" + keyVaultName + ".vault.azure.net";

    const client = new SecretClient(url, credential);

    const SERVICEBUS_CONNECTION_STRING = await client.getSecret("SERVICEBUS_CONNECTION_STRING");

    const serviceBusClient = new ServiceBusClient(SERVICEBUS_CONNECTION_STRING.value);
    const receiver = serviceBusClient.createReceiver(ServiceBusConfig.NEW_JOB_TOPIC, ServiceBusConfig.NEW_JOB_SUBSCRIPTION);

    console.log(`Waiting for messages in ${ServiceBusConfig.NEW_JOB_SUBSCRIPTION}`);

    receiver.subscribe({
            processMessage: async (brokeredMessage) => {
                console.log(`New job: ${brokeredMessage.body}`);
                await sendMail('email', brokeredMessage.body.text); //TODO: change to actual email - email set to temporary email for testing
                await brokeredMessage.complete();
            },
            processError: async (args) => {
                console.log(`Error from error source ${args.errorSource} occurred: `, args.error);
            },
        }
    );
}

main().catch((error) => {
    console.log(error);
    process.exit(1);
});

module.exports = main;