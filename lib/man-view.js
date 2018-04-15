'use babel';

import { Point, TextEditor } from 'atom';
const {GoogleAuth, JWT, OAuth2Client} = require('google-auth-library');

// Mostly stolen from go-to-line/lib/go-to-line-view.js

export default class ManView {

    constructor(serializedState) {
        this.paneItem = null;

        this.miniEditor = new TextEditor({ mini: true });
        this.miniEditor.element.addEventListener('blur', this.close.bind(this));
        this.miniEditor.setPlaceholderText('Enter manual page');

        this.message = document.createElement('div');
        this.message.classList.add('message');

        this.element = document.createElement('div');
        this.element.classList.add('man');
        this.element.appendChild(this.miniEditor.element);
        this.element.appendChild(this.message);

        this.panel = atom.workspace.addModalPanel({
            item: this,
            visible: false,
        });

        atom.commands.add(this.miniEditor.element, 'core:confirm', () => {
            this.confirm();
        });
        atom.commands.add(this.miniEditor.element, 'core:cancel', () => {
            this.close();
        });
    }

    close() {
        if (! this.panel.isVisible()) return;
        this.miniEditor.setText('');
        this.panel.hide();
        if (this.miniEditor.element.hasFocus()) {
            this.restoreFocus();
        }
    }

    confirm() {
        const code = this.miniEditor.getText();
        this.close();
        console.log('this is the entered text:', code)

        var credentials = JSON.parse(atom.config.get('atom-gmail.client_secret'));

        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var auth = new GoogleAuth();
        var oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            atom.config.set('atom-gmail.oauth_token', JSON.stringify(token));
            console.log('Token stored');
        });
    }

    storeFocusedElement() {
        this.previouslyFocusedElement = document.activeElement;
        return this.previouslyFocusedElement;
    }

    restoreFocus() {
        if (this.previouslyFocusedElement && this.previouslyFocusedElement.parentElement) {
            return this.previouslyFocusedElement.focus();
        }
        atom.views.getView(atom.workspace).focus();
    }

    open() {
        if (this.panel.isVisible()) return;
        this.storeFocusedElement();
        this.panel.show();
        this.message.textContent = "Enter 'man' arguments here, e.g. 'ls' or '5 crontab'";
        this.miniEditor.element.focus();
    }

    // Returns an object that can be retrieved when package is activated
    serialize() {}

    // Tear down any state and detach
    destroy() {
        this.element.remove();
    }

    setCurrentWord(w) {
        this.miniEditor.setText(w);
        this.miniEditor.selectAll();
    }

}
