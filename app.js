const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Initialize Gmail API and Nodemailer
const gmail = google.gmail('v1');
const OAuth2 = google.auth.OAuth2;

// Gmail API credentials
const credentials = {
    client_id: '59115091535-0n42nqfhqqkm0vi6vbiafu4c67ae29hj.apps.googleusercontent.com',
       client_secret: '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',
      redirect_uri: ['http://localhost:3000'],
       auth_uri:"https://accounts.google.com/o/oauth2/auth",
    //   token_uri:"https://oauth2.googleapis.com/token",
};

// OAuth2 client
const oauth2Client = new OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uri
);

// Authenticate with Gmail API
const getAccessToken = async () => {
  // Get access token from OAuth2 client
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
  });
  console.log('Authorize this app by visiting the following URL:\n', url);

  // Enter the authorization code obtained from the URL
  const authCode = 'ENTER_AUTHORIZATION_CODE';

  // Get access token using the authorization code
  const { tokens } = await oauth2Client.getToken(authCode);
  oauth2Client.setCredentials(tokens);
  return tokens.access_token;
};

// Define function to check if email is the first email in its thread
const isFirstEmail = async (threadId, accessToken) => {
  const response = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    auth: oauth2Client,
  });
  return response.data.messages.length === 1;
};

// Define function to add label to email
const addLabelToEmail = async (emailId, labelName, accessToken) => {
  await gmail.users.messages.modify({
    userId: 'me',
    id: emailId,
    resource: {
      addLabelIds: [labelName],
    },
    auth: oauth2Client,
  });
};

// Define function to move email to labeled section
const moveEmailToLabeledSection = async (emailId, labelName, accessToken) => {
  await gmail.users.messages.modify({
    userId: 'me',
    id: emailId,
    resource: {
      removeLabelIds: ['INBOX'],
      addLabelIds: [labelName],
    },
    auth: oauth2Client,
  });
};

// Define function to check for new emails and send replies
const checkAndReplyToEmails = async (accessToken) => {
  // Fetch new emails from Gmail API
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    auth: oauth2Client,
  });
  const newEmails = response.data.messages || [];

  // Loop through each new email
  for (const email of newEmails) {
    // Check if email is part of an existing thread or first email in the thread
    const threadId = email.threadId;
    const isFirstEmail = await isFirstEmail(threadId, accessToken);

    if (isFirstEmail) {
      // Compose reply using Nodemailer
      const replyContent = 'This is my reply email content.';
      const replyMessage = {
        to: email.from,
        subject: 'Re: ' + email.subject,
        text: replyContent,
      };

      // Send reply email using Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'your-email@gmail.com', // Replace with your Gmail email
          accessToken: accessToken,
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret,
          refreshToken: 'YOUR_REFRESH_TOKEN',
        },
      });
      await transporter.sendMail(replyMessage);

      // Add label to replied email using Gmail API
      const labelName = 'Replied'; // Replace with your desired label name
      await addLabelToEmail(email.id, labelName, accessToken);

      // Move replied email to labeled section using Gmail API
      await moveEmailToLabeledSection(email.id, labelName, accessToken);
    }
  }
};

// Get access token and start the email checking and response logic
const startApp = async () => {
  const accessToken = await getAccessToken();
  setInterval(() => {
    checkAndReplyToEmails(accessToken);
  }, Math.floor(Math.random() * (120 - 45 + 1)) + 45 * 1000);
};

// Start the app
startApp();
