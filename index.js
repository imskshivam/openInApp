// app.js

const express = require("express");
const app = express();
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const { getUnrepliedMessages, createLabel } = require("./gmailFunctions"); // Import the functions

const port = 3030;

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://mail.google.com/",
];

const labelName = "Auto_Reply";

app.get("/", async (req, res) => {
  const auth = await authenticate({
    keyfilePath: path.join(__dirname, "credentials.json"),
    scopes: SCOPES,
  });

  const gmail = google.gmail({ version: "v1", auth });

  async function main() {
    const labelId = await createLabel(auth);

    setInterval(async () => {
      const messages = await getUnrepliedMessages(auth);

      if (messages && messages.length > 0) {
        for (const message of messages) {
          const messageData = await gmail.users.messages.get({
            auth,
            userId: "me",
            id: message.id,
          });

          const email = messageData.data;
          const hasReplied = email.payload.headers.some(
            (header) => header.name === "In-Reply-To"
          );

          if (!hasReplied) {
            const replyMessage = {
              userId: "me",
              resource: {
                raw: Buffer.from(
                  `To: ${
                    email.payload.headers.find(
                      (header) => header.name === "From"
                    ).value
                  }\r\n` +
                    `Subject: Re: ${
                      email.payload.headers.find(
                        (header) => header.name === "Subject"
                      ).value
                    }\r\n` +
                    `Content-Type: text/plain; charset="UTF-8"\r\n` +
                    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                    `Thank you for your email. I wanted to let you know that I am currently out of the office on leave and will not be able to respond to emails during this time.\r\n`
                ).toString("base64"),
              },
            };

            await gmail.users.messages.send(replyMessage);

            await gmail.users.messages.modify({
              auth,
              userId: "me",
              id: message.id,
              resource: {
                addLabelIds: [labelId],
                removeLabelIds: ["INBOX"],
              },
            });
          }
        }
      }
    }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
  }

  main();

  res.json({ "this is Auth": auth });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});
