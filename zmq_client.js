const zmq = require("zeromq");

let sock = null;
let queue = Promise.resolve();

/**
 * ソケット生成
 */
function createSocket() {
  if (!sock) {
    sock = new zmq.Request();

    try {
      sock.connect("tcp://127.0.0.1:5555");
      console.log("ZMQ connected → tcp://127.0.0.1:5555");
    } catch (e) {
      console.error("ZMQ connection error:", e);
      throw e;
    }
  }
  return sock;
}

/**
 * ソケット破棄
 */
function resetSocket() {
  try {
    if (sock) {
      sock.close();
      console.log("ZMQ socket closed");
    }
  } catch (e) {
    console.error("ZMQ close error:", e);
  }
  sock = null;
}

/**
 * JSON送受信
 */
async function sendJson(obj, timeoutMs = 30000) {
  queue = queue.then(async () => {
    const socket = createSocket();

    try {
      const jsonStr = JSON.stringify(obj);
      const jsonBuf = Buffer.from(jsonStr, "utf8");  //  UTF-8 明示

      console.log("================================");
      console.log("ZMQ SEND(JSON)");
      console.log(jsonStr);

      await socket.send(jsonBuf);

      console.log("ZMQ WAIT REPLY(JSON)");

      const replyBuffer = await receiveWithTimeout(socket, timeoutMs);
      const replyText = replyBuffer.toString("utf8"); //  UTF-8 明示

      console.log("ZMQ REPLY(JSON)");
      console.log(replyText);

      return JSON.parse(replyText);
    } catch (e) {
      console.error("ZMQ sendJson error:", e);
      resetSocket();
      return { status: "ERROR", reason: e.message || "ZMQ communication failed" };
    }
  });

  return queue;
}

/**
 * multipart送受信
 * cmd: string
 * meta: object (JSON)
 * fileBuffer: Buffer (binary)
 */
async function sendMultipart(cmd, meta = {}, fileBuffer = Buffer.alloc(0), timeoutMs = 20000) {
  queue = queue.then(async () => {
    const socket = createSocket();

    try {
      const frames = [
        Buffer.from(cmd, "utf8"),                     // frame 0: cmd
        Buffer.from(JSON.stringify(meta), "utf8"),    // frame 1: JSON meta
        fileBuffer                                   // frame 2: バイナリ
      ];

      console.log("================================");
      console.log("ZMQ SEND(MULTIPART)");
      console.log("cmd:", cmd);
      console.log("meta:", meta);
      console.log("binary bytes:", fileBuffer.length);

      await socket.send(frames);

      console.log("ZMQ WAIT REPLY(MULTIPART)");

      const replyFrames = await receiveWithTimeout(socket, timeoutMs);
      const replyText = replyFrames.toString("utf8"); //  UTF-8 明示

      console.log("ZMQ REPLY(MULTIPART)");
      console.log(replyText);

      return JSON.parse(replyText);
    } catch (e) {
      console.error("ZMQ sendMultipart error:", e);
      resetSocket();
      return { status: "ERROR", reason: e.message || "ZMQ communication failed" };
    }
  });

  return queue;
}

/**
 * タイムアウト付き受信（既存）
 */
function receiveWithTimeout(socket, timeoutMs) {
  return new Promise((resolve, reject) => {
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error(`ZMQ receive timeout (${timeoutMs} ms)`));
    }, timeoutMs);

    socket.receive().then((frames) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (!frames || frames.length === 0) {
        reject(new Error("Received empty ZMQ message"));
        return;
      }

      // JSON も multipart も最終的に JSON 1フレームで返す前提
      resolve(frames[0]);
    }).catch((err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

module.exports = function () {
  return {
    sendJson,
    sendMultipart
  };
};
