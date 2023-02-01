var amqp = require('amqplib/callback_api');
var nodemailer = require('nodemailer');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const authServiceUrl = `${process.env.AUTHENTICATIONURL}/users/emails`;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});
const RabbitMQConfig = {
    NEW_JOB_EXCHANGE: "NEW_JOB_EXCHANGE",
    NEW_JOB_QUEUE: "NEW_JOB_QUEUE",
    NEW_JOB_ROUTING_KEY: "new.job"
};

amqp.connect(`amqp://${process.env.RABBITURL}`, (error0, connection) => {
    if (error0) {
        throw error0;
    }
    connection.createChannel((error1, channel) => {
        if (error1) {
            throw error1;
        }
        channel.assertExchange(RabbitMQConfig.NEW_JOB_EXCHANGE, 'topic', {
            durable: false
        });
        channel.assertQueue(RabbitMQConfig.NEW_JOB_QUEUE, {
            exclusive: false
        }, (error2, q) => {
            if (error2) {
                throw error2;
            }
            console.log("Waiting for messages in %s", q.queue);
            channel.bindQueue(q.queue, RabbitMQConfig.NEW_JOB_EXCHANGE, RabbitMQConfig.NEW_JOB_ROUTING_KEY);
            channel.consume(q.queue, (message) => {
                if (message !== null) {
                    const messageContent = message.content.json();
                    console.log("Received %s", messageContent);
                    const title = messageContent.title;
                    fetch(authServiceUrl)
                        .then((response) => response.json())
                        .then((data) => {
                            const emails = data.emails;
                            emails.forEach((email) => {
                                const mailOptions = {
                                    from: process.env.EMAIL,
                                    to: email,
                                    subject: 'New job available',
                                    text: title
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        console.log('Email sent: %s', info.messageId);
                                    }
                                });
                            });
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                    channel.ack(message);
                }
            }, {
                noAck: false
            });
        });
    });
});