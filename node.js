const { google } = require('googleapis');
const nodemailer = require('nodemailer');



// Gmail API credentials
const credentials = {
    client_id: '59115091535-0n42nqfhqqkm0vi6vbiafu4c67ae29hj.apps.googleusercontent.com',
       client_secret: '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',
      redirect_uri: ['http://localhost:3000'],
       auth_uri:"https://accounts.google.com/o/oauth2/auth",
    //   token_uri:"https://oauth2.googleapis.com/token",
};

// OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uri
  );


 

// const { tokens } = await oauth2Client.getToken(code);
// const accessToken = tokens.access_token;
// const refreshToken = tokens.refresh_token;


// Set up Gmail API scopes
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];


 // Generate authorization URL
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  // Authenticate with Gmail API using authorization code
const authenticate = async (authCode) => {
    const { tokens } = await oAuth2Client.getToken(authCode);
    oAuth2Client.setCredentials(tokens);
  };

   console.log(authUrl);


  // Define function to check for new emails and send replies
const checkAndReplyToEmails = async () => {
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Fetch new emails from Gmail API
  const res = await gmail.users.messages.list({ userId: 'me', labelIds: 'INBOX', q: 'is:unread' });
  const emails = res.data.messages || [];

  // Loop through each new email
  for (const email of emails) {
    const emailData = await gmail.users.messages.get({ userId: 'me', id: email.id });

    // Check if email is part of an existing thread or the first email in the thread
    if (!emailData.data.threadId || emailData.data.threadId === emailData.data.id) {
      const { headers, snippet } = emailData.data;

      // Compose reply email using Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          type: 'OAuth2',
          user: headers.find((header) => header.name === 'From').value,
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret,
          refreshToken: oAuth2Client.credentials.refresh_token,
          accessToken: oAuth2Client.credentials.access_token,
        },
      });

      const mailOptions = {
        from: headers.find((header) => header.name === 'To').value,
        to: headers.find((header) => header.name === 'From').value,
        subject: 'RE: ' + headers.find((header) => header.name === 'Subject').value,
        text: 'Thank you for your email!',
      };

      // Send reply email using Nodemailer
      await transporter.sendMail(mailOptions);

      // Add label to replied email using Gmail API
      await gmail.users.messages.modify({
        userId: 'me',
        id: email.id,
        requestBody: { addLabelIds: ['SENT'] },
      });

      // Move replied email to labeled section using Gmail API
      await gmail.users.messages.modify({
        userId: 'me',
        id: email.id,
        requestBody: { removeLabelIds: ['INBOX'] },
      });
    }
  }
};

// Set interval for executing the email checking and response logic
const interval = Math.floor(Math.random() * (120 - 45 + 1)) + 45;
setInterval(checkAndReplyToEmails, interval * 1000);