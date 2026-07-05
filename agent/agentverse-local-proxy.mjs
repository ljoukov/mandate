import http from 'node:http';

const listenPort = Number.parseInt(process.env.AGENTVERSE_PROXY_PORT ?? '8008', 10);
const targetPort = Number.parseInt(process.env.MANDATE_AGENT_PORT ?? '8009', 10);
const targetHost = process.env.MANDATE_AGENT_HOST ?? '127.0.0.1';

const hopByHopHeaders = new Set([
  'connection',
  'forwarded',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-real-ip'
]);

function filteredHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => !hopByHopHeaders.has(key.toLowerCase()))
  );
}

const server = http.createServer((clientRequest, clientResponse) => {
  const upstreamRequest = http.request(
    {
      host: targetHost,
      port: targetPort,
      method: clientRequest.method,
      path: clientRequest.url,
      headers: {
        ...filteredHeaders(clientRequest.headers),
        host: `${targetHost}:${targetPort}`
      }
    },
    (upstreamResponse) => {
      clientResponse.writeHead(
        upstreamResponse.statusCode ?? 502,
        upstreamResponse.statusMessage,
        filteredHeaders(upstreamResponse.headers)
      );
      upstreamResponse.pipe(clientResponse);
    }
  );

  upstreamRequest.on('error', (error) => {
    clientResponse.writeHead(502, { 'content-type': 'application/json' });
    clientResponse.end(JSON.stringify({ error: error.message }));
  });

  clientRequest.pipe(upstreamRequest);
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(
    `Agentverse local proxy listening on 127.0.0.1:${listenPort} -> ${targetHost}:${targetPort}`
  );
});
