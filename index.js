const readline = require("readline");
const { connectAndSendRequest } = require("./network/network");
const { CALL_TYPE_STREAM_ALL, CALL_TYPE_RESEND } = require("./config/config");

// Start the client
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Enter callType (1 for Stream All Packets, 2 for Resend Packet): ",
  (callTypeInput) => {
    const callType = parseInt(callTypeInput, 10);

    if (callType === CALL_TYPE_STREAM_ALL || callType === CALL_TYPE_RESEND) {
      connectAndSendRequest(callType);
    } else {
      console.error("Invalid callType");
    }
    rl.close();
  }
);
