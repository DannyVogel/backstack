import { defineHandler, setHeader, setResponseStatus } from 'nitro/h3'

export default defineHandler((event) => {
  setResponseStatus(event, 404)
  setHeader(event, 'Content-Type', 'text/html')

  const path = event.path || '/'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Not Found</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #fafafa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 6rem;
      font-weight: 700;
      color: #333;
    }
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    p {
      color: #888;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
    code {
      background: #1a1a1a;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #f87171;
    }
    a {
      color: #60a5fa;
      text-decoration: none;
      margin-top: 1.5rem;
      display: inline-block;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <h2>Route Not Found</h2>
    <p>The requested path <code>${path}</code> does not exist.</p>
    <a href="/">&larr; Back to home</a>
  </div>
</body>
</html>`
})
