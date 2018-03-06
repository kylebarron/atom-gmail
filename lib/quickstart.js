var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
const {GoogleAuth, JWT, OAuth2Client} = require('google-auth-library');
const {CompositeDisposable, Point, Range} = require('atom');
var hljs = require('highlight.js'); // https://highlightjs.org/
var md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  }
});

module.exports = {
  config: {
    credentials: {
      title: 'Credentials',
      type: 'string',
      default: '',
      description: 'hi'
    },
    token: {
      type: 'string',
      default: '',
      description: 'token'
    }
  },

  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.commands.add('atom-workspace',
      'atom-gmail:send-email', () => this.sendEmail())
    );
  },

  deactivate() {
    return this.subscriptions.dispose();
  },

  getEmailObject() {
    var editor = atom.workspace.getActiveTextEditor();
    var text = editor.getText();
    var result = md.render(text);
    var emailObject = {
      'to': 'kylebarron2@gmail.com',
      'subject': 'hello world',
      'message': result,
      'type': 'html'
    };
    return emailObject;
  },

  sendEmail() {
    var credentials = JSON.parse(atom.config.get('atom-gmail.credentials'));

    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new GoogleAuth();
    var oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    var token = atom.config.get('atom-gmail.token');
    oauth2Client.credentials = JSON.parse(token);

    this.sendMessage(oauth2Client, this.getEmailObject());
  },

  _getEditorAndBuffer() {
    const editor = atom.workspace.getActiveTextEditor();
    const buffer = editor.getBuffer();
    return [editor, buffer];
  },

  SCOPES: [
      'https://www.googleapis.com/auth/gmail.compose'
  ],

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  getNewToken(oauth2Client, callback) {
      var authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: this.SCOPES
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
              this.storeToken(token);
              callback(oauth2Client);
          });
      });
  },

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  storeToken(token) {
    try {
      fs.mkdirSync(this.TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(this.TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + this.TOKEN_PATH);
  },

  makeBody(to, subject, message, type) {
      var str = [];
      if (type == 'html') {
          str.push("Content-Type: text/html; charset=\"UTF-8\"\n");
      } else {
          str.push("Content-Type: text/plain; charset=\"UTF-8\"\n");
      }
      str.push("MIME-Version: 1.0\n");
      str.push("Content-Transfer-Encoding: 7bit\n");
      str.push("to: ", to, "\n");
      str.push("subject: ", subject, "\n\n");
      str.push(message);
      str = str.join('');
      var encodedMail = new Buffer(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
      return encodedMail;
  },

  sendMessage(auth, emailObject) {
      var gmail = google.gmail('v1');
      var raw = this.makeBody(emailObject.to, emailObject.subject, emailObject.message, emailObject.type);
      gmail.users.messages.send({
          auth: auth,
          userId: 'me',
          resource: {
              raw: raw
          }
      }, function(err, response) {
          console.log(err || response);
      });
  },

};
