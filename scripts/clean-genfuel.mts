// Image-edit: убрать текст «SILENT GERMANY» и любые надписи с красного генератора
// (кадр: мужчина ремонтирует генератор, тёплый свет) — для уголка и баннера хаба.
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imageBuffer = fs.readFileSync('scripts/corner-src/genfuel2-7.jpg')
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  const response = await zai.images.generations.edit({
    prompt:
      'Remove ALL text, logos and lettering on the red generator machine and anywhere else in the photo (including the words "SILENT GERMANY" on the generator body). Replace those areas with clean plain surfaces matching the machine color and texture. Keep everything else exactly the same: the man repairing the red generator, the garage/workshop scene, the warm evening lighting, composition and colors unchanged.',
    images: [{ url: base64Image }],
    size: '1280x720',
  })
  const base64 = response?.data?.[0]?.base64
  if (!base64) {
    console.error('No image data returned')
    return
  }
  fs.writeFileSync('scripts/corner-src/genfuel2-7-clean.png', Buffer.from(base64, 'base64'))
  console.log('saved scripts/corner-src/genfuel2-7-clean.png')
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e)
  process.exit(1)
})
