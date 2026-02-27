import express from 'express'

const app = express()
const port = process.env.GATEWAY_PORT ?? 3000

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gateway' })
})

app.listen(port, () => {
  console.log(`Gateway running on port ${port}`)
})
