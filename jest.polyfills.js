// Polyfill ReadableStream/WritableStream for Node.js test environment
try {
  const streams = require('web-streams-polyfill/ponyfill');
  if (!globalThis.ReadableStream) globalThis.ReadableStream = streams.ReadableStream;
  if (!globalThis.WritableStream) globalThis.WritableStream = streams.WritableStream;
} catch {}

// Polyfill TextEncoder/TextDecoder for Node.js test environment
try {
  const { TextEncoder, TextDecoder } = require('util');
  if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder;
  if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder;
} catch {}

// Polyfill fetch, Request, Response, Headers, FormData, File, Blob for Node.js test environment
try {
  const { fetch, Request, Response, Headers, FormData, File, Blob } = require('undici');
  if (!globalThis.fetch) globalThis.fetch = fetch;
  if (!globalThis.Request) globalThis.Request = Request;
  if (!globalThis.Response) globalThis.Response = Response;
  if (!globalThis.Headers) globalThis.Headers = Headers;
  if (!globalThis.FormData) globalThis.FormData = FormData;
  if (!globalThis.File) globalThis.File = File;
  if (!globalThis.Blob) globalThis.Blob = Blob;
} catch {} 