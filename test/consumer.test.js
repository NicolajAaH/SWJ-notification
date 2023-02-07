const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const setupWorker = require('msw/node');
const rest = require('msw').rest;


var worker = setupWorker.setupServer(
    rest.get('http://localhost:3000/users/emails', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json(['email1', 'email2'])
        );
    })
);

process.env.URL_AUTHENTICATIONSERVICE= 'http://localhost:3000';

chai.use(sinonChai);
const { expect } = chai;

const amqp = require('amqplib/callback_api');

describe('AMQP Consume Method', () => {
    let channelStub;
    let consumeStub;
    let ackStub;

    beforeEach(() => {
        sinon.stub(console, 'log');
        channelStub = sinon.spy(amqp.Channel);
        channelStub.assertExchange = sinon.stub();

        consumeStub = sinon.stub().callsFake((queue, cb) => cb({ content: new Buffer(JSON.stringify({ title: 'Test job' })) }));
        ackStub = sinon.stub();

        channelStub.consume = consumeStub;
        channelStub.ack = ackStub;
        channelStub.assertQueue = sinon.stub().callsFake((queue, options, cb) => cb(null, { queue: 'test' }));
        channelStub.bindQueue = sinon.stub();

        sinon.stub(amqp, 'connect').callsFake((url, cb) => {
            cb(null, {
                createChannel: (cb) => {
                    cb(null, channelStub);
                }
            });
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should call the consume method and process the consumed message', (done) => {
        require('../consumer');

        worker.listen();
        setTimeout(() => {
            expect(consumeStub).to.have.been.calledOnce;
            expect(ackStub).to.have.been.calledOnce;
            expect(console.log).to.have.been.calledWith('Received {"title":"Test job"}');
            expect(console.log).to.have.been.calledWith('Title: Test job');
            expect(console.log).to.have.been.calledWith('Email: email1');
            expect(console.log).to.have.been.calledWith('Email: email2');
            done();
        }, 50);
    });
});
