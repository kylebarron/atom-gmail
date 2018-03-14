/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Dialog;
const {TextEditor, CompositeDisposable, Disposable, Emitter, Range, Point} = require('atom');
const path = require('path');

module.exports =
(Dialog = class Dialog {
  constructor(param) {
    if (param == null) { param = {}; }
    const {iconClass, prompt} = param;
    this.emitter = new Emitter();
    this.disposables = new CompositeDisposable();

    this.element = document.createElement('div');
    this.element.classList.add('tree-view-dialog');

    this.promptText = document.createElement('label');
    this.promptText.classList.add('icon');
    if (iconClass) { this.promptText.classList.add(iconClass); }
    this.promptText.textContent = prompt;
    this.element.appendChild(this.promptText);

    this.miniEditor = new TextEditor({mini: true});
    const blurHandler = () => {
      if (document.hasFocus()) { return this.close(); }
    };
    this.miniEditor.element.addEventListener('blur', blurHandler);
    this.disposables.add(new Disposable(() => this.miniEditor.element.removeEventListener('blur', blurHandler)));
    this.disposables.add(this.miniEditor.onDidChange(() => this.showError()));
    this.element.appendChild(this.miniEditor.element);

    this.errorMessage = document.createElement('div');
    this.errorMessage.classList.add('error-message');
    this.element.appendChild(this.errorMessage);

    atom.commands.add(this.element, {
      'core:confirm': () => this.onConfirm(this.miniEditor.getText()),
      'core:cancel': () => this.cancel()
    }
    );
  }

  attach() {
    this.panel = atom.workspace.addModalPanel({item: this});
    this.miniEditor.element.focus();
    return this.miniEditor.scrollToCursorPosition();
  }

  close() {
    const { panel } = this;
    this.panel = null;
    if (panel != null) {
      panel.destroy();
    }
    this.emitter.dispose();
    this.disposables.dispose();
    this.miniEditor.destroy();
    const activePane = atom.workspace.getCenter().getActivePane();
    if (!activePane.isDestroyed()) { return activePane.activate(); }
  }

  cancel() {
    this.close();
    return __guard__(document.querySelector('.tree-view'), x => x.focus());
  }

  showError(message) {
    if (message == null) { message = ''; }
    this.errorMessage.textContent = message;
    if (message) {
      this.element.classList.add('error');
      return window.setTimeout((() => this.element.classList.remove('error')), 300);
    }
  }
});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
