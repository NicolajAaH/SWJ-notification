const amqp = require('amqplib/callback_api');
const nodemailer = require('nodemailer');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

require('dotenv').config();

const authServiceUrl = `${process.env.URL_AUTHENTICATIONSERVICE}/users/emails`;

//const transporter = nodemailer.createTransport({
//    service: 'gmail',
//    auth: {
//        user: process.env.EMAIL,
//        pass: process.env.EMAIL_PASSWORD
//    }
//});
const RabbitMQConfig = {
    NEW_JOB_EXCHANGE: 'NEW_JOB_EXCHANGE',
    NEW_JOB_QUEUE: 'NEW_JOB_QUEUE',
    NEW_JOB_ROUTING_KEY: 'new.job',
};

amqp.connect(`amqp://${process.env.RABBITURL}`, (error, connection) => {
    if (error) {
        throw error;
    }
    connection.createChannel((channelError, channel) => {
        if (channelError) {
            throw channelError;
        }
        channel.assertExchange(RabbitMQConfig.NEW_JOB_EXCHANGE, 'topic', { durable: false });
        channel.assertQueue(RabbitMQConfig.NEW_JOB_QUEUE, { exclusive: false }, (queueError, q) => {
            if (queueError) {
                throw queueError;
            }
            console.log(`Waiting for messages in ${q.queue}`);
            channel.bindQueue(q.queue, RabbitMQConfig.NEW_JOB_EXCHANGE, RabbitMQConfig.NEW_JOB_ROUTING_KEY);
            channel.consume(q.queue, message => {
                if (message) {
                    const messageContent = message.content.toString();
                    console.log(`Received ${messageContent}`);
                    const job = JSON.parse(messageContent);
                    const title = job.title;
                    console.log(`Title: ${title}`);
                    fetch(authServiceUrl, { method: 'GET' })
                        .then(response => response.json())
                        .then(data => {
                            data.forEach(email => {
                                console.log(`Email: ${email}`);
                                console.log(`Title: ${title}`);
                                //const mailOptions = {
                                //    from: process.env.EMAIL,
                                //    to: process.env.EMAIL,
                                //    subject: 'New job available',
                                //    text: title
                                //};
                                //transporter.sendMail(mailOptions, (error, info) => {
                                //    if (error) {
                                //        console.log(error);
                                //    } else {
                                //        console.log('Email sent: %s', info.messageId);
                                //    }
                                //});
                            });
                        })
                        .catch(error => {
                            console.error(error);
                        });
                    channel.ack(message);
                }
            }, { noAck: false });
        });
    });
});
