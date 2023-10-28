// gmailFunctions.js

const { google } = require("googleapis");

const labelName = "Auto_Reply";

async function getUnrepliedMessages(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    q: "is:unread",
  });

  return response.data.messages || [];
}

async function createLabel(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  try {
    const response = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    return response.data.id;
  } catch (error) {
    if (error.code === 409) {
      const response = await gmail.users.labels.list({
        userId: "me",
      });
      const label = response.data.labels.find(
        (label) => label.name === labelName
      );
      return label.id;
    } else {
      throw error;
    }
  }
}

module.exports = {
  getUnrepliedMessages,
  createLabel,
};
