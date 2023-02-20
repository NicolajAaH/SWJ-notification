const {SecretClient} = require("@azure/keyvault-secrets");
const sinon = require('sinon');
const {expect} = require('chai');
var sinonChai = require("sinon-chai");
var chai = require("chai");
chai.use(sinonChai);


describe('Main function', () => {
    let secretClient;

    beforeEach(() => {
        secretClient = sinon.stub(SecretClient.prototype, 'getSecret').resolves({value: 'Endpoint=sb://job-boards-service-bus.servicebus.windows.net/;SharedAccessKeyName=Job-Service;SharedAccessKey=key='});
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should listen to the new_job subscription', async () => {
        sinon.stub(process, 'exit');

        sinon.stub(console, 'log');

        const main = require('../consumer');

        await main();

        expect(secretClient).to.have.been.calledWith('SERVICEBUS_CONNECTION_STRING');

        expect(console.log).to.have.been.calledWith('Waiting for messages in notificationservice');

    });
});
