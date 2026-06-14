/**
 * Captures the full #pdf-export-root column, slices it into A4 pages,
 * and adds clickable internal links on every card-header so clicking the
 * section title in the PDF jumps to that section.
 *
 * Also adds a PDF outline (bookmarks panel) for quick navigation.
 */
export async function exportDashboardPdf(reportMeta, onProgress) {
  // ── 1. Load libraries ───────────────────────────────────────────────────────
  const [h2cMod, jspdfMod] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const html2canvas = h2cMod.default ?? h2cMod
  const jsPDF       = jspdfMod.jsPDF  ?? jspdfMod.default

  if (typeof html2canvas !== 'function') throw new Error('html2canvas failed to load')
  if (typeof jsPDF       !== 'function') throw new Error('jsPDF failed to load')

  // ── 2. Locate root element ──────────────────────────────────────────────────
  const root = document.getElementById('pdf-export-root')
  if (!root) throw new Error('#pdf-export-root not found')

  onProgress?.('Preparing…')

  // Scroll to very top so all measurements are from a stable origin
  window.scrollTo({ top: 0, behavior: 'instant' })
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  // ── 3. Measure section headers BEFORE capture ───────────────────────────────
  // Collect every card-header's title text + its Y position in the document.
  // We'll use these to place clickable links + bookmarks in the final PDF.
  const rootRect = root.getBoundingClientRect()

  const sections = []
  root.querySelectorAll('.card-header').forEach((header) => {
    const titleEl = header.querySelector('.card-title')
    const label   = titleEl ? titleEl.textContent.trim() : 'Section'
    const rect    = header.getBoundingClientRect()
    // Y offset relative to the root element's top (both measured at scroll=0)
    const yInRoot = rect.top - rootRect.top
    sections.push({
      label,
      yInRoot,               // px from top of root element
      headerH: rect.height,  // height of the header band
      headerW: rect.width,
    })
  })

  // ── 4. Capture ──────────────────────────────────────────────────────────────
  const bgColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg-primary').trim() || '#0f1117'

  onProgress?.('Capturing dashboard…')

  const fullH = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    root.scrollHeight,
  )
  const prevHeight    = root.style.height
  const prevOverflow  = root.style.overflow
  const prevMinHeight = root.style.minHeight
  root.style.height    = fullH + 'px'
  root.style.minHeight = fullH + 'px'
  root.style.overflow  = 'visible'

  let canvas
  try {
    canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      windowWidth:  document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      ignoreElements: (el) =>
        el.classList.contains('no-pdf') ||
        el.classList.contains('modal-overlay') ||
        el.classList.contains('pdf-progress-overlay') ||
        el.classList.contains('widget-controls') ||
        el.classList.contains('drag-handle'),
    })
  } finally {
    root.style.height    = prevHeight
    root.style.minHeight = prevMinHeight
    root.style.overflow  = prevOverflow
  }

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error('html2canvas returned an empty canvas')
  }

  onProgress?.('Building PDF…')

  // ── 5. Layout constants ─────────────────────────────────────────────────────
  const A4_W  = 794
  const A4_H  = 1123
  const SCALE = 2   // html2canvas scale used above

  // canvas.width  = root.offsetWidth  * SCALE
  // canvas.height = root.offsetHeight * SCALE  (after we pinned it)
  // imgH = how tall the full image is when fitted to A4_W
  const imgW = A4_W
  const imgH = Math.ceil((canvas.height / canvas.width) * imgW)

  // Ratio: converts a CSS px distance inside root → image-space px
  const cssToImg = imgH / (canvas.height / SCALE)

  // ── 6. Pre-compute each section's position in PDF space ─────────────────────
  // For each section we need: pageNumber (0-based) + yOnPage (px from top of page)
  const sectionPdfPositions = sections.map((sec) => {
    const yImg   = sec.yInRoot * cssToImg          // y in image-space
    const pageNo = Math.floor(yImg / A4_H)         // 0-based page index
    const yOnPg  = yImg - pageNo * A4_H            // y within that page
    const hImg   = sec.headerH * cssToImg
    const wImg   = Math.min(sec.headerW * cssToImg, A4_W)
    return { ...sec, pageNo, yOnPg, hImg, wImg }
  })

  // ── 7. Build PDF pages ───────────────────────────────────────────────────────
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [A4_W, A4_H],
  })

  let yOffset   = 0
  let pageIndex = 0

  while (yOffset < imgH) {
    if (pageIndex > 0) pdf.addPage()

    const sliceImgH = Math.min(A4_H, imgH - yOffset)
    const srcY = Math.round((yOffset   / imgH) * canvas.height)
    const srcH = Math.ceil( (sliceImgH / imgH) * canvas.height)

    const tmp    = document.createElement('canvas')
    tmp.width    = canvas.width
    tmp.height   = Math.max(1, srcH)
    const ctx    = tmp.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, tmp.width, tmp.height)
    ctx.drawImage(canvas, 0, -srcY)

    const imgData = tmp.toDataURL('image/jpeg', 0.92)
    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, sliceImgH)

    yOffset   += A4_H
    pageIndex += 1
  }

  if (pageIndex === 0) throw new Error('PDF has no pages — nothing was captured')

  // ── 8. Add internal links on every card-header ───────────────────────────────
  // Each link is an invisible clickable rectangle drawn over the header band.
  // Clicking it jumps to the same section (page + Y position).
  sectionPdfPositions.forEach((sec) => {
    if (sec.pageNo >= pageIndex) return  // section beyond captured pages

    // Go to the target page (1-based in jsPDF)
    pdf.setPage(sec.pageNo + 1)

    // pdf.link(x, y, w, h, options)
    // options.pageNumber = 1-based page to jump to
    // options.magFactor = 'Fit' fits the whole page
    pdf.link(
      0,           // x — start of header (full width)
      sec.yOnPg,   // y — top of header on this page
      sec.wImg,    // w — full header width
      sec.hImg,    // h — header height
      { pageNumber: sec.pageNo + 1 }
    )
  })

  // ── 9. PDF outline (bookmarks sidebar) ──────────────────────────────────────
  // jsPDF exposes pdf.outline for building a nested bookmark tree.
  // Each entry is clickable in Acrobat / most PDF viewers.
  if (pdf.outline) {
    sectionPdfPositions.forEach((sec) => {
      if (sec.pageNo >= pageIndex) return
      try {
        pdf.outline.add(null, sec.label, { pageNumber: sec.pageNo + 1 })
      } catch (_) { /* outline API may not be available in all jsPDF builds */ }
    })
  }

  // ── 10. Save ─────────────────────────────────────────────────────────────────
  onProgress?.('Saving…')

  const role    = reportMeta?.role    || 'Research'
  const company = reportMeta?.company || ''
  const date    = reportMeta?.date    ||
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

  const fileName = `${role}-${company ? company + '-' : ''}${date}.pdf`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  pdf.save(fileName)
  onProgress?.(null)
}
