const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendOrderReadyEmail({ to, name, orderId }) {
  return transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: `Your order #${orderId} is ready 🍱`,
    text: `Hi ${name},\n\nYour order #${orderId} is now ready for pickup.\n\nThank you!`,
  });
}

module.exports = { sendOrderReadyEmail };