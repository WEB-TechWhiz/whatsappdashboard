const PACKET_TYPES = /* @__PURE__ */ Object.create(null);
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
const PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
Object.keys(PACKET_TYPES).forEach((key) => {
  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
const ERROR_PACKET = { type: "error", data: "parser error" };
const encodePacket = ({ type, data }, supportsBinary, callback) => {
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return callback(supportsBinary ? data : "b" + toBuffer(data, true).toString("base64"));
  }
  return callback(PACKET_TYPES[type] + (data || ""));
};
const toBuffer = (data, forceBufferConversion) => {
  if (Buffer.isBuffer(data) || data instanceof Uint8Array && !forceBufferConversion) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  } else {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
};
let TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
  if (packet.data instanceof ArrayBuffer || ArrayBuffer.isView(packet.data)) {
    return callback(toBuffer(packet.data, false));
  }
  encodePacket(packet, true, (encoded) => {
    if (!TEXT_ENCODER) {
      TEXT_ENCODER = new TextEncoder();
    }
    callback(TEXT_ENCODER.encode(encoded));
  });
}
const decodePacket = (encodedPacket, binaryType) => {
  if (typeof encodedPacket !== "string") {
    return {
      type: "message",
      data: mapBinary(encodedPacket, binaryType)
    };
  }
  const type = encodedPacket.charAt(0);
  if (type === "b") {
    const buffer = Buffer.from(encodedPacket.substring(1), "base64");
    return {
      type: "message",
      data: mapBinary(buffer, binaryType)
    };
  }
  if (!PACKET_TYPES_REVERSE[type]) {
    return ERROR_PACKET;
  }
  return encodedPacket.length > 1 ? {
    type: PACKET_TYPES_REVERSE[type],
    data: encodedPacket.substring(1)
  } : {
    type: PACKET_TYPES_REVERSE[type]
  };
};
const mapBinary = (data, binaryType) => {
  switch (binaryType) {
    case "arraybuffer":
      if (data instanceof ArrayBuffer) {
        return data;
      } else if (Buffer.isBuffer(data)) {
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
        return data.buffer;
      }
    case "nodebuffer":
    default:
      if (Buffer.isBuffer(data)) {
        return data;
      } else {
        return Buffer.from(data);
      }
  }
};
const SEPARATOR = String.fromCharCode(30);
const encodePayload = (packets, callback) => {
  const length = packets.length;
  const encodedPackets = new Array(length);
  let count = 0;
  packets.forEach((packet, i) => {
    encodePacket(packet, false, (encodedPacket) => {
      encodedPackets[i] = encodedPacket;
      if (++count === length) {
        callback(encodedPackets.join(SEPARATOR));
      }
    });
  });
};
const decodePayload = (encodedPayload, binaryType) => {
  const encodedPackets = encodedPayload.split(SEPARATOR);
  const packets = [];
  for (let i = 0; i < encodedPackets.length; i++) {
    const decodedPacket = decodePacket(encodedPackets[i], binaryType);
    packets.push(decodedPacket);
    if (decodedPacket.type === "error") {
      break;
    }
  }
  return packets;
};
function createPacketEncoderStream() {
  return new TransformStream({
    transform(packet, controller) {
      encodePacketToBinary(packet, (encodedPacket) => {
        const payloadLength = encodedPacket.length;
        let header;
        if (payloadLength < 126) {
          header = new Uint8Array(1);
          new DataView(header.buffer).setUint8(0, payloadLength);
        } else if (payloadLength < 65536) {
          header = new Uint8Array(3);
          const view = new DataView(header.buffer);
          view.setUint8(0, 126);
          view.setUint16(1, payloadLength);
        } else {
          header = new Uint8Array(9);
          const view = new DataView(header.buffer);
          view.setUint8(0, 127);
          view.setBigUint64(1, BigInt(payloadLength));
        }
        if (packet.data && typeof packet.data !== "string") {
          header[0] |= 128;
        }
        controller.enqueue(header);
        controller.enqueue(encodedPacket);
      });
    }
  });
}
let TEXT_DECODER;
function totalLength(chunks) {
  return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
  if (chunks[0].length === size) {
    return chunks.shift();
  }
  const buffer = new Uint8Array(size);
  let j = 0;
  for (let i = 0; i < size; i++) {
    buffer[i] = chunks[0][j++];
    if (j === chunks[0].length) {
      chunks.shift();
      j = 0;
    }
  }
  if (chunks.length && j < chunks[0].length) {
    chunks[0] = chunks[0].slice(j);
  }
  return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
  if (!TEXT_DECODER) {
    TEXT_DECODER = new TextDecoder();
  }
  const chunks = [];
  let state = 0;
  let expectedLength = -1;
  let isBinary = false;
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
      while (true) {
        if (state === 0) {
          if (totalLength(chunks) < 1) {
            break;
          }
          const header = concatChunks(chunks, 1);
          isBinary = (header[0] & 128) === 128;
          expectedLength = header[0] & 127;
          if (expectedLength < 126) {
            state = 3;
          } else if (expectedLength === 126) {
            state = 1;
          } else {
            state = 2;
          }
        } else if (state === 1) {
          if (totalLength(chunks) < 2) {
            break;
          }
          const headerArray = concatChunks(chunks, 2);
          expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
          state = 3;
        } else if (state === 2) {
          if (totalLength(chunks) < 8) {
            break;
          }
          const headerArray = concatChunks(chunks, 8);
          const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
          const n = view.getUint32(0);
          if (n > Math.pow(2, 53 - 32) - 1) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
          expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
          state = 3;
        } else {
          if (totalLength(chunks) < expectedLength) {
            break;
          }
          const data = concatChunks(chunks, expectedLength);
          controller.enqueue(decodePacket(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
          state = 0;
        }
        if (expectedLength === 0 || expectedLength > maxPayload) {
          controller.enqueue(ERROR_PACKET);
          break;
        }
      }
    }
  });
}
const protocol = 4;
export {
  decodePayload as a,
  encodePacket as b,
  createPacketDecoderStream as c,
  decodePacket as d,
  encodePayload as e,
  createPacketEncoderStream as f,
  protocol as p
};
