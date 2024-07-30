const { CALL_TYPE_RESEND } = require("../config/config");

// Create request payload based on callType
function createRequestPayload(callType, resendSeq) {
  const buffer = Buffer.alloc(2); // Enough for callType and resendSeq

  buffer.writeUInt8(callType, 0);
  if (callType === CALL_TYPE_RESEND) {
    if (resendSeq === undefined || isNaN(resendSeq)) {
      throw new Error("resendSeq must be a number for CALL_TYPE_RESEND");
    }
    buffer.writeUInt8(resendSeq, 1);
  }

  return buffer;
}

// Parse a single packet
function parsePacket(data) {
  const { PACKET_SIZE } = require("../config/config");

  if (data.length < PACKET_SIZE) {
    throw new Error("Incomplete packet received");
  }

  const symbol = data.slice(0, 4).toString("ascii").trim();
  const buySell = String.fromCharCode(data.readUInt8(4));
  const quantity = data.readInt32BE(5);
  const price = data.readInt32BE(9);
  const packetSeq = data.readInt32BE(13);

  return { symbol, buySell, quantity, price, packetSeq };
}

// Export functions
module.exports = {
  createRequestPayload,
  parsePacket,
};
