// zmq_client_pool.js
const zmq = require("zeromq");

function createReqClient() {
  const sock = new zmq.Request();
  sock.connect("tcp://127.0.0.1:5555");
  console.log("REQ connected → tcp://127.0.0.1:5555");

  async function sendJson(obj, timeoutMs = 30000) {
    try {
      const jsonStr = JSON.stringify(obj);
      await sock.send(Buffer.from(jsonStr, "utf8"));
      const frames = await receiveWithTimeout(sock, timeoutMs);

      const replyText = frames[0].toString("utf8");
      return JSON.parse(replyText);
    } catch (e) {
      console.error("REQ sendJson error:", e);
      return { status: "ERROR", reason: e.message };
    }
  }

  return { sendJson };
}

function receiveWithTimeout(socket, timeoutMs) {
  return new Promise((resolve, reject) => {
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error(`ZMQ receive timeout (${timeoutMs} ms)`));
      }
    }, timeoutMs);

    socket.receive().then((frames) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(frames);
      }
    }).catch((err) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        reject(err);
      }
    });
  });
}

function createReqPool(count = 8) {
  const basePort = 5555;
  const clients = [];

  for (let i = 0; i < count; i++) {
    clients.push(createReqClient(basePort + i));
  }

  return clients;
}

module.exports = { createReqPool };
