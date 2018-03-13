# atom-gmail

Use Atom to send emails through Gmail.

This is still in Alpha. It works great for me, but there are probably still bugs.
I suggest sending yourself a given email before sending it to your intended recipient.



## Installation

First install the package, either with `apm install atom-gmail`, or by going to Settings > Install > `atom-gmail`.
Then you need to download credentials from your Gmail account:

- Use [this wizard](https://console.developers.google.com/start/api?id=gmail) to create or select a project in the Google Developers Console and automatically turn on the API. Click **Continue**, then **Go to credentials**.
- On the **Add credentials to your project** page, click the **Cancel** button.
- At the top of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter a **Product name** if not already set, and click the **Save** button.
- Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
- Select the application type **Other**, enter the name "Gmail API Quickstart", and click the **Create** button.
- Click **OK** to dismiss the resulting dialog.
- Click the file download (Download JSON) button to the right of the client ID.
- Copy and paste the contents of this file to the **Client Secret** field in the configuration settings of this package. (I.e. Settings > atom-gmail > Client Secret)

A second authentication step is necessary. I'm working on the UI to expose this cleanly.

## Usage

### Header

The metadata for the email must be written in a YAML header at the top of the document. The initial `---` must be the first three characters of the document and on its own line. There must be `---` on a line by itself at the end of the YAML.

The available fields in the YAML header are:
- `to:`
- `subject:`
- `from:` (optional)
- `cc:` (optional)
- `bcc:` (optional)

For example:
```yaml
---
to:
  - john.smith@example.com
  - johndoe@gmail.com
cc: foo@bar.org
from: me@helloworld.com
subject: This email is from Atom!
---
```

### Content

The rest of the document should be written in standard [CommonMark Markdown](http://spec.commonmark.org/0.28/). See [example.md](example.md) for an example document, and see [Markdown Extensions](#markdown-extensions) for a list of optional extensions to the Markdown specification.

### Formatting

By default, this package applies [Github Markdown styling](https://sindresorhus.com/github-markdown-css/) to text. At this point, document styling cannot be changed, except for a few small tweaks exposed in the package settings.

By default Github-like styling is also applied to code; the code syntax highlighting style can be changed with the "Code highlighting style" option in the settings.

### Markdown Extensions

This package uses [markdown-it](https://github.com/markdown-it/markdown-it) as its markdown parser. Therefore, any [markdown-it plugin](https://www.npmjs.com/browse/keyword/markdown-it-plugin) can be supported. Extension support hasn't been implemented as of March 12; add an issue to ping me about it.

### Sending the Email

Open up the command palette (either <kbd>ctrl</kbd>+<kbd>shift</kbd>+<kbd>P</kbd> or <kbd>cmd</kbd>+<kbd>shift</kbd>+<kbd>P</kbd>) and start typing `atom-gmail:send-email`. The fuzzy search will find the command without having to type that text exactly.

## Todo

- Mathjax support
- Attachment support
- Support replies
