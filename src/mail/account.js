const apiKey = process.env.SENDGRID_API_KEY;

const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(apiKey);

const welcomeMail = (email, name) => {
  const msg = {
    to: email,
    from: "tripathiharshcoder@gmail.com",
    subject: `Welcome Message`,
    text: `Hello Mr/Mrs ${name}. We are happy to serve you`,
  };
  sgMail.send(msg);
};

const cancellationMail = (email, name) => {
  const msg = {
    to: email,
    from: "tripathiharshcoder@gmail.com",
    subject: "Cancellation Message",
    text: `We thank you Mr/Mrs ${name} for using our service`,
  };
  sgMail.send(msg);
};

module.exports = {
  welcomeMail,
  cancellationMail,
};
