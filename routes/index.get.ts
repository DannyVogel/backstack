import { defineHandler, setHeader } from 'nitro/h3'

export default defineHandler((event) => {
  setHeader(event, 'Content-Type', 'text/html')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BackStack API</title>
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
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #888;
      font-size: 1.1rem;
    }
    code {
      background: #1a1a1a;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>BackStack</h1>
    <p>API server is running</p>
  </div>
</body>
</html>`
})
