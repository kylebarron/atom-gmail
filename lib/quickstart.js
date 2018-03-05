var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
const {GoogleAuth, JWT, OAuth2Client} = require('google-auth-library');


var SCOPES = [
    'https://www.googleapis.com/auth/gmail.compose'
];

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'atom-gmail.json';

function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new GoogleAuth();
    var oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function (code) {
        rl.close();
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function makeBody(to, subject, message, type) {
    var str = [];
    if (type == 'html') {
        str.push("Content-Type: text/html; charset=\"UTF-8\"\n")
    } else {
        str.push("Content-Type: text/plain; charset=\"UTF-8\"\n")
    }
    str.push("MIME-Version: 1.0\n");
    str.push("Content-Transfer-Encoding: 7bit\n");
    str.push("to: ", to, "\n");
    str.push("subject: ", subject, "\n\n");
    str.push(message);
    str = str.join('');
    var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
};

function sendMessage(auth) {
    var gmail = google.gmail('v1');
    var raw = makeBody(emailObject.to, emailObject.subject, emailObject.message, emailObject.type);
    gmail.users.messages.send({
        auth: auth,
        userId: 'me',
        resource: {
            raw: raw
        }
    }, function(err, response) {
        console.log(err || response)
    });
}

const secretlocation = 'client_secret.json'
emailObject = {};
emailObject.to = 'redacted'
emailObject.subject = 'hello world'
emailObject.message = 'this is a test'
emailObject.type = 'plain'

fs.readFile(secretlocation, function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Gmail API.
    authorize(JSON.parse(content), sendMessage);
});
