// loadChunkParallel.js
const { createReqPool } = require("./zmq_client_pool");

async function loadChunkParallel(projectId) {
  const clients = createReqPool(8);
  const totalParts = 8;

  const promises = clients.map((client, idx) => {
    return client.sendJson({
      cmd: "load_chunk",
      project_id: projectId,
      part: idx,
      total_parts: totalParts
    });
  });

  const results = await Promise.all(promises);

  const chunks = results.map(r => Buffer.from(r.chunk_b64, "base64"));
  const packed = Buffer.concat(chunks);

  return packed;
}

module.exports = { loadChunkParallel };
