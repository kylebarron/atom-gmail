'use babel';

const { Point, Range } = require('atom');
const fs = require('fs');
const path = require('path');

import AuthView from './auth-view';
import Config from './config';

const juice = require('juice');
const hljs = require('highlight.js');
const yaml = require('js-yaml');
const md = require('markdown-it')({
  html: true,
  linkify: atom.config.get('atom-gmail.linkify'),
  typographer: true,
  highlight: function(str, lang) {
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

function getCodeCSS() {
  css_choice = atom.config.get('atom-gmail.code_highlighting') + '.css';
  atom_path = atom.configDirPath;

  css_path = path.join(atom_path, 'packages', 'atom-gmail', 'lib', 'styles', css_choice);
  css = fs.readFileSync(css_path, 'utf8');
  return css;
}

function getTextCSS() {
  var css = [];
  css.push('.markdown-body {');
  css.push('	box-sizing: border-box;');
  css.push('  min-width: 200px;');
  css.push('	max-width: ' + atom.config.get('atom-gmail.max_width') + ';');
  css.push('	font-size: ' + atom.config.get('atom-gmail.font_size') + 'px;');
  if (atom.config.get('atom-gmail.centered')) {
    css.push('  margin: 0 auto;');
  }
  css.push('	padding: 45px;');
  css.push('}');
  css = css.join('\n');

  atom_path = atom.configDirPath;
  css_path = path.join(atom_path, 'packages', 'atom-gmail', 'lib', 'document_styles', 'github-markdown.css');
  css += fs.readFileSync(css_path, 'utf8');
  return css;
}

export function getEmailObject() {
  [metadata, text] = parseMarkdown();

  var emailObject = {
    'to': metadata.to,
    'cc': metadata.cc,
    'subject': metadata.subject,
  };

  if (metadata.type != 'undefined') {
    if (metadata.type == 'plain') {
      emailObject['type'] = 'plain';
      emailObject['message'] = text;
      return emailObject;
    }
  }

  var html = [];
  html.push('<article class="markdown-body">');
  html.push(md.render(text));
  html.push('</article>');
  html = html.join('\n');

  var css = getCodeCSS();
  html = juice.inlineContent(html, css);
  css = getTextCSS();
  html = juice.inlineContent(html, css);

  emailObject['type'] = 'html';
  emailObject['message'] = html;
  return emailObject;
}

function parseMarkdown() {
  const editor = atom.workspace.getActiveTextEditor();

  // Make sure first line has ---
  first_row_text = editor.lineTextForBufferRow(0);
  if (first_row_text != '---') {
    var msg = 'File does not contain YAML header';
    atom.notifications.addError(msg);
    throw msg;
  }

  // Find first following line with ---
  var numberOfLines = editor.getLineCount();
  var forwardRange = [new Point(1, 0), new Point(numberOfLines + 1, 0)];

  var yamlEnd = null;
  editor.scanInBufferRange(/^---\r?$/g, forwardRange, function(result) {
    yamlEnd = result.range.end.row;
    return result.stop();
  });

  var yaml_range = new Range(new Point(1, 0), new Point(yamlEnd, 0));
  var yaml_text = editor.getTextInBufferRange(yaml_range);
  var metadata = yaml.safeLoad(yaml_text);

  var text_range = new Range(new Point(yamlEnd + 1, 0), new Point(numberOfLines + 1, 0));
  var text = editor.getTextInBufferRange(text_range);

  return [metadata, text];
}
