import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const imageBuffer = fs.readFileSync('/tmp/candidates/a1.jpg')
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  const response = await zai.images.generations.edit({
    prompt:
      'Remove the small brand logo and any text on the white battery storage unit and the inverter device on the wall near the cylindrical batteries. Make these surfaces clean plain white with no logos, no text, no branding. Keep everything else exactly the same: the modern white house, rooftop solar panels, warm golden hour lighting, green lawn, car, interior furniture.',
    images: [{ url: base64Image }],
    size: '1344x768',
  })
  const base64 = response?.data?.[0]?.base64
  if (!base64) {
    console.error('No image data returned')
    return
  }
  fs.writeFileSync('/tmp/candidates/a1-clean.png', Buffer.from(base64, 'base64'))
  console.log('saved /tmp/candidates/a1-clean.png')
}

main().catch((e) => {
  console.error('FAILED:', e?.message || e)
  process.exit(1)
})
