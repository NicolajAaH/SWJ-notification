const kafka = require('kafka-node');
const nodemailer = require('nodemailer');
const request = require('request');
require('dotenv').config();

const authServiceUrl = `${process.env.AUTHENTICATIONURL}/users/emails`;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: `${process.env.KAFKAURL}` });
const consumer = new Consumer(
  client,
  [{ topic: 'NEW_JOB', partition: 0 }],
  {
    autoCommit: true
  }
);

consumer.on('message', async function(message) {
  const job = JSON.parse(message.value);
  console.log(`Received job: ${job}`);

  request(authServiceUrl, { json: true }, async (err, res, body) => {
    if (err) {
      console.error(err);
      return;
    }

    const registeredUsers = body.users;
    for (const user of registeredUsers) {
      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'New job opportunity',
        text: `A new job with the title "${job.title}" is available.`
      };

      await transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log(`Email sent: ${info.response}`);
        }
      });
    }
  });
});

consumer.connect();
console.log('Kafka consumer connected and subscribed to topic NEW_JOB');
