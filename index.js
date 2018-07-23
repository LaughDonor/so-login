const LOGIN_PAGE = 'https://stackoverflow.com/users/login';
const { Chromeless } = require('chromeless');
const Mailgun = require('mailgun-js');
const confFile = require('./conf.json');

let mailgun = null;
if (confFile.mailgun_api_key && confFile.mailgun_domain) {
    mailgun = Mailgun({
        apiKey: confFile.mailgun_api_key,
        domain: confFile.mailgun_domain
    });
}

function processResult(text) {
    sendMail(text, `Hi man. That's your stat for now: ${text}`);
}

function processError(errText) {
    sendMail("Error", `Something went wrong: ${JSON.stringify(errText)}`)
}

function sendMail(subject, text) {
    if (mailgun) {
        mailgun
            .messages()
            .send({
                from: 'SO Visitor <no-reply@mailgun.org>',
                to: confFile.email,
                subject: `Stackoverflow visiting report (${subject})`,
                text: text
            }, (error, body) => {
                if (error) {
                    console.error("MAIL Error:", body, "|", text);
                    throw error;
                }
            });
    }
}

async function run() {
  const chromeless = new Chromeless()

  const text = await chromeless
    .goto(LOGIN_PAGE)
    .wait('#login-form')
    .type(confFile.email, '#email')
    .type(confFile.password, '#password')
    .click('#submit-button')
    .wait('a.my-profile')
    .click('a.my-profile')
    .wait('#top-cards')
    .evaluate(() => {
      // this will be executed in headless chrome
      const el = document.querySelector('#top-cards span.-count');
      return el && el.innerText;
    })

  await chromeless.end();

  return text;
}

run().then(processResult).catch(processError);