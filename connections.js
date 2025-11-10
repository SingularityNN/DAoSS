// Глобальные переменные
let draggedFromPalette = null;
let selectedBlock = null;
let draggedBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let connectionStart = null;
let allConnections = [];
let allBlocks = [];
let blockCounter = 0;
const gridSize = 20;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupPaletteEvents();
    setupCanvasEvents();
});

// ========== ПАЛИТРА - DRAG START ==========
function setupPaletteEvents() {
    const elementItems = document.querySelectorAll('.element-item.draggable');

    elementItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedFromPalette = this.getAttribute('data-type');
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'copy';
        });

        item.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
        });
    });
}

// ========== ХОЛСТ - DROP EVENTS ==========
function setupCanvasEvents() {
    const canvas = document.getElementById('canvas');

    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        canvas.style.opacity = '0.95';
    });

    canvas.addEventListener('dragleave', function(e) {
        if (e.target === canvas) {
            canvas.style.opacity = '1';
        }
    });

    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        canvas.style.opacity = '1';

        if (!draggedFromPalette) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        createBlockAtPosition(draggedFromPalette, x, y);
        draggedFromPalette = null;
    });

    canvas.addEventListener('click', function(e) {
        if (e.target === canvas || e.target.tagName === 'svg') {
            deselectBlock();
        }
    });
}

// ========== СОЗДАНИЕ БЛОКА ==========
function createBlockAtPosition(type, x, y) {
    // Привязка к сетке
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;

    const block = document.createElement('div');
    block.className = `block ${getBlockClass(type)}`;
    block.id = `block_${blockCounter}`;
    block.style.left = x + 'px';
    block.style.top = y + 'px';

    const text = getBlockText(type);
    block.textContent = text;

    const canvas = document.getElementById('canvas');
    canvas.appendChild(block);

    const blockData = {
        id: block.id,
        type: type,
        element: block,
        x: x,
        y: y,
        text: text
    };

    allBlocks.push(blockData);
    blockCounter++;

    // Добавляем слушатели
    setupBlockEvents(block, blockData);
    createConnectorPoints(block, blockData);
}

function getBlockClass(type) {
    switch(type) {
        case 'start': return 'start-end';
        case 'decision': return 'decision';
        case 'input': return 'input-output';
        default: return '';
    }
}

function getBlockText(type) {
    const texts = {
        'start': 'Начало',
        'process': 'Процесс',
        'decision': 'Условие?',
        'input': 'Ввод данных'
    };
    return texts[type] || 'Элемент';
}

// ========== СОБЫТИЯ БЛОКОВ ==========
function setupBlockEvents(block, blockData) {
    block.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('connector-dot')) {
            return;
        }

        selectBlock(block, blockData);

        draggedBlock = block;
        dragOffsetX = e.clientX - block.offsetLeft;
        dragOffsetY = e.clientY - block.offsetTop;
        block.classList.add('dragging');
    });

    block.addEventListener('click', function(e) {
        e.stopPropagation();
        selectBlock(block, blockData);
    });
}

function selectBlock(block, blockData) {
    // Снять выделение с предыдущего блока
    deselectBlock();

    selectedBlock = block;
    block.classList.add('selected');

    // Показать свойства
    showBlockProperties(blockData);
}

function deselectBlock() {
    if (selectedBlock) {
        selectedBlock.classList.remove('selected');
        selectedBlock = null;
    }

    const propertiesPanel = document.getElementById('properties-panel');
    propertiesPanel.innerHTML = '<div class="empty-state"><p>Выберите элемент на холсте</p></div>';
}

function showBlockProperties(blockData) {
    const propertiesPanel = document.getElementById('properties-panel');

    propertiesPanel.innerHTML = `
        <div class="property-group">
            <label>Текст элемента:</label>
            <input type="text" id="block-text-input" value="${blockData.text}" 
                   onchange="updateBlockText('${blockData.id}', this.value)">
        </div>
        <div class="property-group">
            <label>Тип элемента:</label>
            <p style="font-size: 14px; color: #4a5568; margin: 0;">${getTypeLabel(blockData.type)}</p>
        </div>
    `;
}

function getTypeLabel(type) {
    const labels = {
        'start': 'Начало/Конец',
        'process': 'Процесс',
        'decision': 'Условие',
        'input': 'Ввод/Вывод'
    };
    return labels[type] || type;
}

function updateBlockText(blockId, newText) {
    const blockData = allBlocks.find(b => b.id === blockId);
    if (blockData) {
        blockData.text = newText;
        blockData.element.textContent = newText;
    }
}

// ========== ПЕРЕМЕЩЕНИЕ БЛОКОВ ==========
document.addEventListener('mousemove', function(e) {
    if (!draggedBlock) return;

    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;

    // Привязка к сетке
    x = Math.round(x / gridSize) * gridSize;
    y = Math.round(y / gridSize) * gridSize;

    draggedBlock.style.left = x + 'px';
    draggedBlock.style.top = y + 'px';

    // Обновляем все соединения
    updateAllConnections();
});

document.addEventListener('mouseup', function(e) {
    if (draggedBlock) {
        draggedBlock.classList.remove('dragging');
        draggedBlock = null;
    }
});

// ========== ТОЧКИ ПОДКЛЮЧЕНИЯ ==========
function createConnectorPoints(block, blockData) {
    const positions = [
        { x: '50%', y: '0%' },      // верх
        { x: '100%', y: '50%' },    // право
        { x: '50%', y: '100%' },    // низ
        { x: '0%', y: '50%' }       // влево
    ];

    positions.forEach((pos, idx) => {
        const dot = document.createElement('div');
        dot.classList.add('connector-dot');
        dot.style.left = pos.x;
        dot.style.top = pos.y;
        dot.dataset.index = idx;
        dot.dataset.blockId = blockData.id;

        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            handleConnectorClick(dot, blockData);
        });

        block.appendChild(dot);
    });
}

function handleConnectorClick(dot, blockData) {
    if (!connectionStart) {
        connectionStart = { dot: dot, blockData: blockData };
        dot.classList.add('active');
    } else {
        if (connectionStart.blockData.id !== blockData.id) {
            createConnection(connectionStart.blockData, blockData);
        }

        connectionStart.dot.classList.remove('active');
        connectionStart = null;
    }
}

function createConnection(fromBlockData, toBlockData) {
    const svg = document.getElementById('connections-svg');
    const connectionsGroup = document.getElementById('connections-group');

    const fromRect = fromBlockData.element.getBoundingClientRect();
    const toRect = toBlockData.element.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const fromX = fromRect.left - svgRect.left + fromRect.width / 2;
    const fromY = fromRect.top - svgRect.top + fromRect.height / 2;
    const toX = toRect.left - svgRect.left + toRect.width / 2;
    const toY = toRect.top - svgRect.top + toRect.height / 2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', fromX);
    line.setAttribute('y1', fromY);
    line.setAttribute('x2', toX);
    line.setAttribute('y2', toY);

    connectionsGroup.appendChild(line);

    allConnections.push({
        line: line,
        fromBlock: fromBlockData,
        toBlock: toBlockData
    });
}

function updateAllConnections() {
    const svg = document.getElementById('connections-svg');
    const svgRect = svg.getBoundingClientRect();

    allConnections.forEach(conn => {
        const fromRect = conn.fromBlock.element.getBoundingClientRect();
        const toRect = conn.toBlock.element.getBoundingClientRect();

        const fromX = fromRect.left - svgRect.left + fromRect.width / 2;
        const fromY = fromRect.top - svgRect.top + fromRect.height / 2;
        const toX = toRect.left - svgRect.left + toRect.width / 2;
        const toY = toRect.top - svgRect.top + toRect.height / 2;

        conn.line.setAttribute('x1', fromX);
        conn.line.setAttribute('y1', fromY);
        conn.line.setAttribute('x2', toX);
        conn.line.setAttribute('y2', toY);
    });
}

// ========== ЭКСПОРТ И ОЧИСТКА ==========
function exportDiagram() {
    const svg = document.getElementById('connections-svg');
    const blocks = document.querySelectorAll('.block');

    // Создаем новый SVG для экспорта
    const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    exportSvg.setAttribute('width', '1200');
    exportSvg.setAttribute('height', '800');
    exportSvg.setAttribute('viewBox', '0 0 1200 800');
    exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Копируем соединения
    const connectionsGroup = document.getElementById('connections-group');
    const clonedConnections = connectionsGroup.cloneNode(true);
    exportSvg.appendChild(clonedConnections);

    // Копируем блоки
    blocks.forEach(block => {
        const rect = block.getBoundingClientRect();
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${block.offsetLeft}, ${block.offsetTop})`);

        const shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shape.setAttribute('width', block.offsetWidth);
        shape.setAttribute('height', block.offsetHeight);
        shape.setAttribute('fill', 'white');
        shape.setAttribute('stroke', '#667eea');
        shape.setAttribute('stroke-width', '2');
        shape.setAttribute('rx', '8');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', block.offsetWidth / 2);
        text.setAttribute('y', block.offsetHeight / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', '#2d3748');
        text.textContent = block.textContent;

        g.appendChild(shape);
        g.appendChild(text);
        exportSvg.appendChild(g);
    });

    // Экспорт PNG (используя canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(exportSvg);
    const img = new Image();

    img.onload = function() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const link = document.createElement('a');
        link.download = 'flowchart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
}

function clearDiagram() {
    if (confirm('Вы уверены? Это удалит все элементы и соединения.')) {
        // Удаляем все блоки
        const blocks = document.querySelectorAll('.block');
        blocks.forEach(block => block.remove());

        // Очищаем соединения
        const connectionsGroup = document.getElementById('connections-group');
        connectionsGroup.innerHTML = '';

        // Очищаем массивы
        allBlocks = [];
        allConnections = [];
        blockCounter = 0;
        selectedBlock = null;
        connectionStart = null;

        deselectBlock();
    }
}
