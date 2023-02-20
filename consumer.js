const {ServiceBusClient} = require('@azure/service-bus');
const {SecretClient} = require("@azure/keyvault-secrets");
const {DefaultAzureCredential} = require("@azure/identity");

require('dotenv').config();

const ServiceBusConfig = {
    NEW_JOB_TOPIC: 'new_job',
    NEW_JOB_SUBSCRIPTION: 'notificationservice',
};

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