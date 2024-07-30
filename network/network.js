const net = require("net");
const { createRequestPayload, parsePacket } = require("../utils/utils");
const {
  SERVER_HOST,
  SERVER_PORT,
  CALL_TYPE_STREAM_ALL,
  CALL_TYPE_RESEND,
  PACKET_SIZE,
} = require("../config/config");
const {
  savePacketsToFile,
  appendDataToFile,
} = require("../fileUtils/fileUtils");

// Connect to the server
const connect = () => {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(
      { host: SERVER_HOST, port: SERVER_PORT },
      () => {
        console.log("Connected to server");
        resolve(client);
      }
    );
  });
};

// Handle incoming data from the server
const handleData = async (data, packets) => {
  let offset = 0;

  console.log(`Total received data length: ${data.length}`);

  while (offset + PACKET_SIZE <= data.length) {
    try {
      const packet = parsePacket(data.slice(offset, offset + PACKET_SIZE));
      console.log(`Parsed packet: ${JSON.stringify(packet)}`);
      packets[packet.packetSeq] = packet; // Store packet by sequence number
    } catch (error) {
      console.error("Error parsing packet:", error.message);
      break; // Exit loop on parsing error to avoid invalid reads
    }
    offset += PACKET_SIZE;
  }
};

// Receive data for CALL_TYPE_RESEND
const receive = async (client, packets, callType) => {
  return new Promise((resolve) => {
    client.on("data", async (data) => {
      console.log(`Received ${data.length} bytes of data`);
      await handleData(data, packets);

      if (callType === CALL_TYPE_RESEND) {
        client.end();
      }
      resolve();
    });
  });
};

// Connect to the server and send the request
const connectAndSendRequest = async (callType, resendSeq) => {
  let client;
  try {
    client = await connect();
    const payload = createRequestPayload(callType, resendSeq);
    console.log(`Sending payload: ${payload.toString("hex")}`);
    client.write(payload);
    console.log(
      `Request sent with callType ${callType}, resendSeq ${resendSeq}`
    );
  } catch (error) {
    console.error("Error creating request payload:", error.message);
  }
  const packets = {}; // To store received packets

  await receive(client, packets, callType);

  client.on("end", async () => {
    console.log("Server connection closed.");
    await handleEnd(client, packets, callType);
  });

  client.on("error", (err) => {
    console.error("Connection error:", err.message);
  });
};

// Handle end of connection
const handleEnd = async (client, packets, callType) => {
  const packetSeqs = Object.keys(packets).map(Number);
  if (packetSeqs.length > 0 && callType !== CALL_TYPE_RESEND) {
    const maxSeq = Math.max(...packetSeqs);
    const missingSeqs = [];

    for (let i = 1; i <= maxSeq; i++) {
      if (!packetSeqs.includes(i)) {
        missingSeqs.push(i);
      }
    }
    if (missingSeqs.length > 0) {
      console.log(`Missing packet sequences: ${missingSeqs.join(", ")}`);
      savePacketsToFile(packets);
      await requestMissingSequences(missingSeqs);
    } else {
      console.log("All packets received.");
      savePacketsToFile(packets);
    }
  } else if (packetSeqs.length === 0) {
    console.log("No packets received.");
  } else {
    const newData = Object.values(packets);
    appendDataToFile(newData);
  }
};

// Request missing sequences
const requestMissingSequences = async (missingSeqs) => {
  for (let i = 0; i < missingSeqs.length; i++) {
    await connectAndSendRequest(CALL_TYPE_RESEND, missingSeqs[i]);
  }
};

// Export the functions
module.exports = {
  connect,
  connectAndSendRequest,
};
