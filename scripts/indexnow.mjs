/**
 * IndexNow submission script for participating search engines (Bing, Yandex, Naver, Seznam)
 * Sends indexation notifications for canonical URLs.
 */
import https from 'node:https'

const HOST = 'bunkai-reader.raiyan.app'
const KEY = '5c8e391b1f6f4c6e9a8f4c2b9a1d3e5f'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`

const URL_LIST = [
  `https://${HOST}/`,
  `https://${HOST}/epub-reader-online`,
  `https://${HOST}/pdf-reader-online`,
  `https://${HOST}/dark-pdf-reader`,
  `https://${HOST}/features/continuous-reading`,
  `https://${HOST}/guides/how-to-open-epub-files`,
  `https://${HOST}/guides/how-to-read-pdf-in-dark-mode`,
  `https://${HOST}/privacy`,
  `https://${HOST}/about`,
]

async function submitIndexNow() {
  const payload = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST,
  })

  console.log(`Submitting ${URL_LIST.length} URLs to IndexNow (Bing)...`)

  const options = {
    hostname: 'api.indexnow.org',
    port: 443,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload),
    },
  }

  const req = https.request(options, (res) => {
    console.log(`IndexNow response status: ${res.statusCode} ${res.statusMessage}`)
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('IndexNow submission accepted successfully.')
    } else {
      console.warn(`IndexNow returned unexpected status code: ${res.statusCode}`)
    }
  })

  req.on('error', (e) => {
    console.warn('IndexNow request encountered network error:', e.message)
  })

  req.write(payload)
  req.end()
}

submitIndexNow()

