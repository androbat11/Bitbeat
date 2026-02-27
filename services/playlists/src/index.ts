import express from 'express'

const app = express()
const port = process.env.PLAYLISTS_PORT ?? 3004

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'playlists' })
})

app.listen(port, () => {
  console.log(`Playlists running on port ${port}`)
})
