let archivoSeleccionado = null;
let rawData = [];
let headers = [];
let filteredData = [];

document.getElementById('csvFile').addEventListener('change', function(e) {
    archivoSeleccionado = e.target.files[0];
});

function procesarArchivo() {
    if (!archivoSeleccionado) {
        alert("Selecciona un archivo CSV primero.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            parseCSVCorrecto(evt.target.result);
        } catch (err) {
            alert("Error al procesar: " + err.message);
        }
    };
    reader.readAsText(archivoSeleccionado, 'ISO-8859-1');
}

function parseCSVCorrecto(text) {
    let rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentCell.trim());
            if (currentRow.length > 1 || currentRow[0] !== '') {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentCell !== '' || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }

    if (rows.length === 0) {
        alert("El archivo está vacío.");
        return;
    }

    headers = rows[0].map(h => h.replace(/[\r\n]+/g, ' '));
    rawData = rows.slice(1).filter(row => row.length === headers.length);
    filteredData = [...rawData];

    mostrarTabla(headers, filteredData);
    llenarSelectorColumnas(headers);
    alert("¡Archivo cargado con éxito!");
}

function llenarSelectorColumnas(hdrs) {
    const select = document.getElementById('numericColumnSelect');
    select.innerHTML = '<option value="">-- Elige una columna --</option>';
    hdrs.forEach(h => {
        const option = document.createElement('option');
        option.value = h;
        option.textContent = h;
        select.appendChild(option);
    });
    select.onchange = calcularEstadisticas;
}

function mostrarTabla(hdrs, data) {
    const headerTr = document.getElementById('tableHeaders');
    const tbody = document.getElementById('tableBody');
    
    headerTr.innerHTML = hdrs.map(h => `<th>${h}</th>`).join('');
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${hdrs.length}" style="text-align:center;">Sin resultados.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.slice(0, 300).map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
}

function aplicarFiltro() {
    const query = document.getElementById('filterInput').value.toLowerCase().trim();
    if (!query) {
        filteredData = [...rawData];
    } else {
        filteredData = rawData.filter(row => 
            row.some(cell => cell.toLowerCase().includes(query))
        );
    }
    mostrarTabla(headers, filteredData);
    calcularEstadisticas();
}

function limpiarFiltro() {
    document.getElementById('filterInput').value = '';
    filteredData = [...rawData];
    mostrarTabla(headers, filteredData);
    calcularEstadisticas();
}

function calcularEstadisticas() {
    if (rawData.length === 0) return;

    const selectedCol = document.getElementById('numericColumnSelect').value;
    const statsBox = document.getElementById('statsResults');

    if (!selectedCol) {
        statsBox.innerHTML = `<p>Selecciona una columna numérica.</p>`;
        return;
    }

    const colIndex = headers.indexOf(selectedCol);
    if (colIndex === -1) return;

    let valores = [];
    filteredData.forEach(row => {
        let val = parseFloat(row[colIndex]);
        if (!isNaN(val)) valores.push(val);
    });

    if (valores.length === 0) {
        statsBox.innerHTML = `<p>No hay valores numéricos en esta columna.</p>`;
        return;
    }

    const suma = valores.reduce((a, b) => a + b, 0);
    const promedio = (suma / valores.length).toFixed(2);
    const mayor = Math.max(...valores);
    const menor = Math.min(...valores);

    statsBox.innerHTML = `
        <div class="stat-card"><strong>Columna:</strong> ${selectedCol}</div>
        <div class="stat-card"><strong>Promedio:</strong> ${promedio}</div>
        <div class="stat-card"><strong>Máximo:</strong> ${mayor}</div>
        <div class="stat-card"><strong>Mínimo:</strong> ${menor}</div>
        <div class="stat-card"><strong>Total:</strong> ${valores.length}</div>
    `;
}

function generarTXT() {
    if (rawData.length === 0) {
        alert("No hay datos.");
        return;
    }
    const statsBox = document.getElementById('statsResults').innerText;
    let contenidoTxt = "REPORTE DE DATOS\n\n" + statsBox + "\n\nRegistros:\n" + headers.join("\t") + "\n";
    
    filteredData.slice(0, 20).forEach(row => {
        contenidoTxt += row.join("\t") + "\n";
    });

    const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'resultados.txt';
    link.click();
}