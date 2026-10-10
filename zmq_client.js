const zmq = require("zeromq");

let sock = null;
let queue = Promise.resolve();

/**
 * ソケット生成
 */
function createSocket() {
  if (!sock) {
    sock = new zmq.Request();
    sock.connect("tcp://127.0.0.1:5555");
    console.log("ZMQ connected → tcp://127.0.0.1:5555");
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
 * JSON送受信（従来どおり）
 */
async function sendJson(obj, timeoutMs = 30000) {
  queue = queue.then(async () => {
    const socket = createSocket();

    try {
      const jsonStr = JSON.stringify(obj);
      await socket.send(Buffer.from(jsonStr, "utf8"));

      const frames = await receiveWithTimeout(socket, timeoutMs);

      // JSON は 1 フレーム
      const replyText = frames[0].toString("utf8");
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
 * multipart送信（受信は receiveWithTimeout が行う）
 */
async function sendMultipart(cmd, meta = {}, fileBuffer = Buffer.alloc(0), timeoutMs = 20000) {
  queue = queue.then(async () => {
    const socket = createSocket();

    try {
      const frames = [
        Buffer.from(cmd, "utf8"),
        Buffer.from(JSON.stringify(meta), "utf8"),
        fileBuffer
      ];

      await socket.send(frames);

      const replyFrames = await receiveWithTimeout(socket, timeoutMs);

      // replyFrames は [frame0, frame1, frame2] の可能性がある
      return replyFrames;

    } catch (e) {
      console.error("ZMQ sendMultipart error:", e);
      resetSocket();
      return { status: "ERROR", reason: e.message || "ZMQ communication failed" };
    }
  });

  return queue;
}

/**
 * タイムアウト付き受信（multipart 対応）
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

      // multipart の場合は frames をそのまま返す
      resolve(frames);

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
