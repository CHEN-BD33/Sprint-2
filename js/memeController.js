'use strict'

let gElCanvas
let gCtx

function onInit() {
    renderSection('main')
    renderGallery()
    renderKeywordsList()
    initCanvas()
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

function renderSection(sectionName) {
    const mainContainer = document.querySelector('.main-container')
    const editorContainer = document.querySelector('.editor-container')
    const savedContainer = document.querySelector('.saved-memes-container')

    mainContainer.style.display = sectionName === 'main' ? 'block' : 'none'

    editorContainer.classList.toggle('hidden', sectionName !== 'editor')
    savedContainer.classList.toggle('hidden', sectionName !== 'saved')
}


function renderMeme() {
    const meme = getMeme()
    const img = new Image()

    const selectedImg = gImgs.find(img => img.id === meme.selectedImgId)

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

function addEvListeners() {
    gElCanvas.addEventListener('click', onCanvasClick)
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

function drawText(line, idx) {
    const { txt, size, color, x, y } = line

    gCtx.font = `${size}px Impact`
    gCtx.fillStyle = color
    gCtx.strokeStyle = 'black'
    gCtx.lineWidth = 2
    gCtx.textAlign = 'center'
    gCtx.textBaseline = 'middle'

    gCtx.strokeText(txt, x, y)
    gCtx.fillText(txt, x, y)

    const metrics = gCtx.measureText(txt)
    line.width = metrics.width
    line.height = size

    if (idx === gMeme.selectedLineIdx) {
        gCtx.strokeStyle = '#ffffff'
        gCtx.setLineDash([5, 5])
        gCtx.strokeRect(
            x - metrics.width / 2 - 10,
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

function downloadCanvas(elLink) {
    const dataUrl = gElCanvas.toDataURL()

    elLink.href = dataUrl
    elLink.download = 'Meme'
}

function onColorChange(color) {
    setLineColor(color)
    renderMeme()
}

function onFontSize(diff) {
    setFontSize(diff)
    renderMeme()
}

function onAddLine(txt) {
    addLine(txt)

    const elTextInput = document.querySelector('.text-input')
    elTextInput.value = gMeme.lines[gMeme.selectedLineIdx].txt
    elTextInput.focus()

    renderMeme()
}

function onSwitchLine() {
    switchLine()
    updateControlsToSelectedLine()
    renderMeme()
}

function updateControlsToSelectedLine() {
    const selectedLine = gMeme.lines[gMeme.selectedLineIdx]

    const elTextInput = document.querySelector('.text-input')
    elTextInput.value = selectedLine.txt

    const elColorInput = document.querySelector('.color-input')
    elColorInput.value = selectedLine.color
}

function toggleMenu() {
    document.body.classList.toggle('menu-open');
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
    const savedMemes = getSavedMemes()
    const editMeme = savedMemes[idx]

    gMeme = {
        selectedImgId: editMeme.gMeme.selectedImgId,
        selectedLineIdx: editMeme.gMeme.selectedLineIdx,
        lines: editMeme.gMeme.lines
    }

    renderSection('editor')
    renderMeme()
    updateControlsToSelectedLine()
}

function onDeleteLine() {
    deleteLine()
    renderMeme()
}

