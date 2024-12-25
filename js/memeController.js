'use strict'

let gElCanvas
let gCtx

function onInit() {
    renderSection('main')
    renderGallery()
    renderKeywordsList()
    initCanvas()
}

function renderSection(sectionName) {
    const mainContainer = document.querySelector('.main-container')
    const editorContainer = document.querySelector('.editor-container')
    const savedContainer = document.querySelector('.saved-memes-container')

    mainContainer.style.display = sectionName === 'main' ? 'block' : 'none'

    editorContainer.classList.toggle('hidden', sectionName !== 'editor')
    savedContainer.classList.toggle('hidden', sectionName !== 'saved')
}

function onSelectImg(elImg) {
    renderSection('editor')

    const imgId = +elImg.dataset.imgId
    setImg(imgId)
    renderMeme()
}

function coverCanvasWithImg(elImg) {
    gElCanvas.height = (elImg.naturalHeight / elImg.naturalWidth) * gElCanvas.width
    gCtx.drawImage(elImg, 0, 0, gElCanvas.width, gElCanvas.height)
}

function resizeCanvas() {
    const elContainer = document.querySelector('.canvas-container')
    gElCanvas.width = elContainer.clientWidth - 2
}

function initCanvas() {
    gElCanvas = document.querySelector('.editor-canvas')
    gCtx = gElCanvas.getContext('2d')
    addEvListeners()
    window.addEventListener('resize', () => {
        resizeCanvas()
        coverCanvasWithImg(document.querySelector('img'))
    })
    renderMeme()
}

function renderMeme() {
    const meme = getMeme()
    const img = new Image()

    const selectedImg = getImgs().find(img => img.id === meme.selectedImgId)

    if (selectedImg.url.startsWith('data:')) {
        img.src = selectedImg.url
    } else {
        img.src = `images/${meme.selectedImgId}.jpg`
    }

    img.onload = () => {
        coverCanvasWithImg(img)

        meme.lines.forEach((line, idx) => {
            drawText(line, idx)
        })
    }
}

function onCanvasClick(ev) {
    const { offsetX, offsetY } = ev
    const clickedLineIdx = gMeme.lines.findIndex(line => {
        const halfWidth = line.width / 2
        const halfHeight = line.height / 2
        return (
            offsetX >= line.x - halfWidth - 10 &&
            offsetX <= line.x + halfWidth + 10 &&
            offsetY >= line.y - halfHeight - 10 &&
            offsetY <= line.y + halfHeight + 10
        )
    })

    if (clickedLineIdx !== -1) {
        gMeme.selectedLineIdx = clickedLineIdx
        updateControlsToSelectedLine()
        renderMeme()
    }
}

function addEvListeners() {
    gElCanvas.addEventListener('click', onCanvasClick)
}

function drawText(line, idx) {
    const { txt, size, font, color, align, x, y } = line

    gCtx.font = `${size}px ${font}`
    gCtx.fillStyle = color
    gCtx.strokeStyle = 'black'
    gCtx.lineWidth = 2
    gCtx.textAlign = align
    gCtx.textBaseline = 'middle'

    var xPos = x
    if (align === 'left') xPos = 50
    if (align === 'right') xPos = gElCanvas.width - 50

    gCtx.strokeText(txt, xPos, y)
    gCtx.fillText(txt, xPos, y)

    const metrics = gCtx.measureText(txt)
    line.width = metrics.width
    line.height = size

    if (gShouldDrawStroke && idx === gMeme.selectedLineIdx) {
        gCtx.strokeStyle = '#000000'
        gCtx.setLineDash([5, 5])
        var rectX = xPos
        if (align === 'center') rectX -= metrics.width / 2
        if (align === 'right') rectX -= metrics.width

        gCtx.strokeRect(
            rectX - 10,
            y - size / 2 - 10,
            metrics.width + 20,
            size + 20
        )
    }
}

function onTextInput(txt) {
    setLineTxt(txt)
    renderMeme()
}

function onAddLine(txt) {
    addLine(txt)

    const elTextInput = document.querySelector('.text-input')
    elTextInput.value = getSelectedLine().txt
    elTextInput.focus()

    renderMeme()
}

function onSwitchLine() {
    switchLine()
    updateControlsToSelectedLine()
    renderMeme()
}

function onDeleteLine() {
    deleteLine()
    renderMeme()
}

function onFontSize(diff) {
    setFontSize(diff)
    renderMeme()
}

function onChangeFont(font) {
    setFont(font)
    renderMeme()
    updateControlsToSelectedLine()
}

function onAlignText(align) {
    setAlignText(align)
    renderMeme()
    updateControlsToSelectedLine()
}

function onColorChange(color) {
    setLineColor(color)
    renderMeme()
}

function updateControlsToSelectedLine() {

    const meme = getMeme()
    const selectedLine = meme.lines[gMeme.selectedLineIdx]

    const elTextInput = document.querySelector('.text-input')
    elTextInput.value = selectedLine.txt

    const elColorInput = document.querySelector('.color-input')
    elColorInput.value = selectedLine.color

    const elFontSelect = document.querySelector('.font-family-select')
    elFontSelect.value = selectedLine.font

    const alignButtons = document.querySelectorAll('.text-align-controls button')
    alignButtons.forEach(button => {
        button.classList.remove('active')
        if (button.onclick && button.onclick.toString().includes(selectedLine.align)) {
            button.classList.add('active')
        }
    })

}

function downloadCanvas(elLink) {
    const dataUrl = gElCanvas.toDataURL()

    elLink.href = dataUrl
    elLink.download = 'Meme'
}

function onSaveMeme(event) {
    saveMeme()
}

function onSaveNavClick() {
    renderSection('saved')
    renderSavedMeme()
}

function renderSavedMeme() {
    const savedMemes = getSavedMemes()
    if (!savedMemes) return

    const strHtmls = savedMemes.map((memeData, idx) =>
        `<img src="${memeData.imgData}" 
         onclick="onEditMeme(${idx})"
         class="saved-meme-img">
         `).join('')

    document.querySelector('.saved-memes-gallery').innerHTML = strHtmls
}

function onDeleteSavedMemes() {
    deleteSavedMemes()
    renderSavedMeme()
}

function onEditMeme(idx) {
    const editMeme = gSavedMemes[idx]
    gSavedMemes.splice(idx, 1)
    saveToStorage(STORAGE_KEY, gSavedMemes)

    gMeme = {
        selectedImgId: editMeme.gMeme.selectedImgId,
        selectedLineIdx: editMeme.gMeme.selectedLineIdx,
        lines: editMeme.gMeme.lines
    }
    renderSection('editor')
    renderMeme()
    updateControlsToSelectedLine()
}

function toggleMenu() {
    document.body.classList.toggle('menu-open');
}