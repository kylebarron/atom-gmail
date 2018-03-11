const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const {GoogleAuth, JWT, OAuth2Client} = require('google-auth-library');
const {CompositeDisposable, Point, Range} = require('atom');
const juice = require('juice');
const hljs = require('highlight.js'); // https://highlightjs.org/
const md = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(lang, str, true).value +
               '</code></pre>';
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

var css_options = [
  'agate', 'androidstudio', 'arduino-light', 'arta', 'ascetic', 'atelier-cave-dark',
  'atelier-cave-light', 'atelier-dune-dark', 'atelier-dune-light', 'atelier-estuary-dark',
  'atelier-estuary-light', 'atelier-forest-dark', 'atelier-forest-light', 'atelier-heath-dark',
  'atelier-heath-light', 'atelier-lakeside-dark', 'atelier-lakeside-light', 'atelier-plateau-dark',
  'atelier-plateau-light', 'atelier-savanna-dark', 'atelier-savanna-light', 'atelier-seaside-dark',
  'atelier-seaside-light', 'atelier-sulphurpool-dark', 'atelier-sulphurpool-light', 'atom-one-dark',
  'atom-one-light', 'brown-paper', 'codepen-embed', 'color-brewer', 'darcula', 'dark', 'darkula',
  'default', 'docco', 'dracula', 'far', 'foundation', 'github', 'github-gist', 'googlecode',
  'grayscale', 'gruvbox-dark', 'gruvbox-light', 'hopscotch', 'hybrid', 'idea', 'ir-black',
  'kimbie.dark', 'kimbie.light', 'magula', 'monokai', 'monokai-sublime', 'mono-blue', 'obsidian',
  'ocean', 'paraiso-dark', 'paraiso-light', 'pojoaque', 'purebasic', 'qtcreator_dark',
  'qtcreator_light', 'railscasts', 'rainbow', 'routeros', 'school-book', 'solarized-dark',
  'solarized-light', 'sunburst', 'tomorrow', 'tomorrow-night', 'tomorrow-night-blue',
  'tomorrow-night-bright', 'tomorrow-night-eighties', 'vs', 'vs2015', 'xcode', 'xt256', 'zenburn'
];

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
    },
    code_highlighting: {
      title: 'Code highlighting style',
      type: 'string',
      enum: css_options,
      default: 'github',
      description: 'Code highlighting style',
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

  getCodeCSS() {
    css_choice = atom.config.get('atom-gmail.code_highlighting') + '.css';
    atom_path = atom.configDirPath;

    css_path = path.join(atom_path, 'packages', 'atom-gmail', 'lib', 'styles', css_choice);
    css = fs.readFileSync(css_path, 'utf8');
    return css;
  },

  getTextCSS() {
    atom_path = atom.configDirPath;
    css_path = path.join(atom_path, 'packages', 'atom-gmail', 'lib', 'document_styles', 'github-markdown.css');
    css = fs.readFileSync(css_path, 'utf8');
    return css;
  },

  getEmailObject() {
    var editor = atom.workspace.getActiveTextEditor();
    var text = editor.getText();

    var html = [];
    html.push('<article class="markdown-body">');
    html.push(md.render(text));
    html.push('</article>');
    html = html.join('\n');

    var css = this.getCodeCSS();
    html = juice.inlineContent(html, css);
    css = this.getTextCSS();
    html = juice.inlineContent(html, css);

    var emailObject = {
      'to': 'kylebarron2@gmail.com',
      'subject': 'hello world',
      'message': html,
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

    try {
      this.sendMessage(oauth2Client, this.getEmailObject());
      atom.notifications.addSuccess('Email successfully sent');
    } catch (e) {
      atom.notifications.addError(e);
    }
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
