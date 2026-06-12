import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Captures the full #pdf-export-root element section by section
 * and builds a multi-page A4 PDF.
 */
export async function exportDashboardPdf(reportMeta, onProgress) {
  const root = document.getElementById('pdf-export-root')
  if (!root) throw new Error('PDF root element not found')

  onProgress?.('Preparing…')

  // Temporarily scroll to top so html2canvas captures everything
  window.scrollTo(0, 0)

  const A4_WIDTH_PX  = 794   // ~210mm at 96dpi
  const A4_HEIGHT_PX = 1123  // ~297mm at 96dpi
  const SCALE        = 2     // retina quality

  onProgress?.('Capturing dashboard…')

  const canvas = await html2canvas(root, {
    scale: SCALE,
    useCORS: true,
    allowTaint: true,
    backgroundColor: getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary').trim() || '#0f1117',
    windowWidth: A4_WIDTH_PX,
    scrollX: 0,
    scrollY: 0,
    ignoreElements: (el) =>
      el.classList.contains('no-pdf') ||
      el.classList.contains('modal-overlay'),
  })

  onProgress?.('Building PDF…')

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [A4_WIDTH_PX, A4_HEIGHT_PX],
    hotfixes: ['px_scaling'],
  })

  const imgWidth   = A4_WIDTH_PX
  const imgHeight  = (canvas.height / canvas.width) * imgWidth
  const pageHeight = A4_HEIGHT_PX
  let   yOffset    = 0
  let   page       = 0

  while (yOffset < imgHeight) {
    if (page > 0) pdf.addPage()

    // Crop the section of the canvas for this page
    const srcY       = (yOffset / imgHeight) * canvas.height
    const srcHeight  = Math.min(
      (pageHeight / imgHeight) * canvas.height,
      canvas.height - srcY
    )

    const pageCanvas        = document.createElement('canvas')
    pageCanvas.width        = canvas.width
    pageCanvas.height       = srcHeight
    const ctx               = pageCanvas.getContext('2d')
    ctx.drawImage(canvas, 0, -srcY)

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)
    const sliceH  = (srcHeight / canvas.height) * imgHeight

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, sliceH)

    yOffset += pageHeight
    page++
  }

  const role    = reportMeta?.role    || 'Research'
  const company = reportMeta?.company || ''
  const date    = reportMeta?.date    || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  const fileName = `${role.replace(/\s+/g, '-')}-${company ? company + '-' : ''}${date}.pdf`
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  onProgress?.('Saving…')
  pdf.save(fileName)
  onProgress?.(null)
}
