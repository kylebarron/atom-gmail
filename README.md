# atom-gmail
Use Atom to send emails through Gmail or Inbox



## Installation

```
apm install atom-gmail
```

### Turn on the Gmail API
- Use [this wizard](https://console.developers.google.com/start/api?id=gmail) to create or select a project in the Google Developers Console and automatically turn on the API. Click **Continue**, then **Go to credentials**.
- On the **Add credentials to your project** page, click the **Cancel** button.
- At the top of the page, select the **OAuth consent screen** tab. Select an **Email address**, enter a **Product name** if not already set, and click the **Save** button.
- Select the **Credentials** tab, click the **Create credentials** button and select **OAuth client ID**.
- Select the application type **Other**, enter the name "Gmail API Quickstart", and click the **Create** button.
- Click **OK** to dismiss the resulting dialog.
- Click the file download (Download JSON) button to the right of the client ID.
- Copy and paste the contents of this file to the **Client Secret** field in the configuration settings of this package. (I.e. Settings > atom-gmail > Client Secret)


Idea:
Get gmail API key to access your own inbox.
Write in markdown.
Have yaml header that has to: subject: cc: bcc: (from:?) fields
Convert markdown to rendered html (maybe use markdown-here?)
send that rendered output through the API

Should work at least with web-hosted images as well.
