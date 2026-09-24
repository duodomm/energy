// Image-edit, проход 2: убрать текст на кепке и одежде мастера.
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imageBuffer = fs.readFileSync('scripts/corner-src/genfuel2-7-clean.png')
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  const response = await zai.images.generations.edit({
    prompt:
      'Remove all text, logos and lettering on the man\'s green cap and on his gray vest/shirt (including any small tractor logo and words like MUSTANG FENWICK). Make the cap and clothing plain, with no logos and no letters. Keep everything else exactly the same: the man\'s pose and face, the red generator, the workshop background, the warm lighting, composition and colors unchanged.',
    images: [{ url: base64Image }],
    size: '1280x720',
  })
  const base64 = response?.data?.[0]?.base64
  if (!base64) {
    console.error('No image data returned')
    return
  }
  fs.writeFileSync('scripts/corner-src/genfuel2-7-clean2.png', Buffer.from(base64, 'base64'))
  console.log('saved scripts/corner-src/genfuel2-7-clean2.png')
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e)
  process.exit(1)
})
