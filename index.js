const LOGIN_PAGE = 'https://stackoverflow.com/users/login';
const Nightmare = require('nightmare');
const Mailgun = require('mailgun-js');
const confFile = require('./conf.json');
const nightmare = Nightmare({show: false});

let mailgun = null;
if (!confFile.mailgun_api_key && confFile.mailgun_domain) {
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
                    console.error("Error:", body, "|", text);
                    throw error;
                }
            });
    }
    console.log(subject, text);
}

console.log("Start");

nightmare
    .goto(LOGIN_PAGE)
    .wait('#login-form')
    .type('#email', confFile.email)
    .type('#password', confFile.password)
    .click('#submit-button')
    .wait('a.my-profile')
    .click('a.my-profile')
    .wait('#top-cards')
    .evaluate(() => {
        const el = document.querySelector('#top-cards span.-count');
        return el ? el.innerText : 'null';
    })
    .end()
    .then(progressText => {
        processResult(progressText);
    })
    .catch(function (error) {
        processError(error);
    });

console.log("End");