'use babel';

const { CompositeDisposable } = require('atom');
const { google } = require('googleapis');

const opn = require('opn');

import AuthView from './auth-view';
import Config from './config';
import CreateEmail from './create-email';

module.exports = {
  config: Config.schema,
  authView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.authView = new AuthView(state.authViewState);
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.commands.add('atom-text-editor',
      'atom-gmail:send-email', () => this.sendEmail()));
    this.subscriptions.add(atom.commands.add('atom-workspace',
      'atom-gmail:authenticate', () => this.authenticate()));
  },

  deactivate() {
    this.authView.destroy();
    return this.subscriptions.dispose();
  },

  serialize() {
    return {
      authViewState: this.authView.serialize()
    };
  },

  sendEmail() {
    var credentials = JSON.parse(atom.config.get('atom-gmail.client_secret'));

    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

    var token = atom.config.get('atom-gmail.oauth_token');
    oauth2Client.credentials = JSON.parse(token);

    try {
      this.sendMessage(oauth2Client, CreateEmail.getEmailObject());
    } catch (e) {
      console.error(e);
    }
  },

  authenticate() {
    console.log('Starting authenticate function');
    var clientSecretText = atom.config.get('atom-gmail.client_secret');
    if (clientSecretText == '') {
      atom.notifications.addError('Client Secret field in configuration is empty.');
      throw 'Client Secret field in configuration is empty.';
    } else {
      var credentials = JSON.parse(clientSecretText);
      this.authorize(credentials, { callback: (text) => console.log(String(text)) });
    }
  },

  authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    try {
      token = atom.config.get('atom-gmail.oauth_token');
      oauth2Client.credentials = JSON.parse(token);
      atom.notifications.addError('Authentication already completed. Send an email with "Atom Gmail: Send Email"');
    } catch (e) {
      this.getNewToken(oauth2Client, callback);
    }
  },

  SCOPES: [
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.metadata'
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
    opn(authUrl);
    this.authView.open();
  },

  makeBody(emailObject) {
    var str = [];
    if (emailObject.type == 'plain') {
      str.push('Content-Type: text/plain; charset="UTF-8"\n');
    } else {
      str.push('Content-Type: text/html; charset="UTF-8"\n');
    }
    str.push('MIME-Version: 1.0\n');
    str.push('Content-Transfer-Encoding: 7bit\n');
    if (emailObject.to) {
      str.push('to: ', emailObject.to, '\n');
    } else {
      throw 'To field is missing';
    }
    if (emailObject.cc) {
      str.push('cc: ', emailObject.cc, '\n');
    }
    if (emailObject.bcc) {
      str.push('bcc: ', emailObject.bcc, '\n');
    }
    if (emailObject.from) {
      str.push('from: ', emailObject.from, '\n');
    }
    if (emailObject.subject) {
      str.push('subject: ', emailObject.subject, '\n\n');
      // TODO warn for empty subject
    } else {
      str.push('subject: \n\n');
    }
    if (emailObject.message) {
      str.push(emailObject.message);
    }
    str = str.join('');
    var encodedMail = new Buffer(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    return encodedMail;
  },

  sendMessage(auth, emailObject) {
    var gmail = google.gmail('v1');
    var raw = this.makeBody(emailObject);
    gmail.users.messages.send({
      auth: auth,
      userId: 'me',
      resource: {
        raw: raw
      }
    }, function(err, response) {
      console.log(err || response);
    });
    var msg = [];
    msg.push('Email successfully sent');
    msg.push('- To: ' + emailObject.to);
    msg = msg.join('\n');
    atom.notifications.addSuccess(msg);
  },
};