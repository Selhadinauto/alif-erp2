// Local cache lookup variables configuration matrix
if (!localStorage.getItem('alif_auth_token')) {
    window.location.href = '/views/login.html';
}

function switchContext(targetView) {
    const sandbox = document.getElementById('app-viewport-sandbox');
    const loader = document.getElementById('view-loader');
    
    loader.classList.remove('hidden');
    sandbox.src = `/views/${targetView}`;
    
    // Manage dynamic tab selection styling states
    const keys = ['dash', 'prod', 'pos', 'rep'];
    keys.forEach(key => {
        const item = document.getElementById(`nav-${key}`);
        if(item) {
            if(key === targetView || (targetView==='products' && key==='prod') || (targetView==='reports' && key==='rep')) {
                item.className = "w-full text-left px-4 py-3 rounded-xl bg-emerald-600 text-white font-black shadow-md transition-all";
            } else {
                item.className = "w-full text-left px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all";
            }
        }
    });

    sandbox.onload = () => { loader.classList.add('hidden'); };
}

// Cross-Frame Message Exchange Pipeline Listener Execution Vector
window.addEventListener('message', function(payload) {
    if (payload.data && payload.data.type === 'EXECUTE_DOCUMENT_RENDER') {
        renderVirtualInvoiceCanvasContext(payload.data.data, payload.data.size, payload.data.cart);
    }
});

function renderVirtualInvoiceCanvasContext(data, size, cart) {
    const canvasNode = document.getElementById('dynamic-invoice-canvas');
    const timestampString = new Date(data.created_at).toLocaleString('am-ET');
    const labelTitle = data.type === 'PROFORMA' ? 'PROFORMA INVOICE' : 'CASH SALES INVOICE';
    
    let tableRowsMap = cart.map((item, index) => `
        <tr style="border-bottom: 1px dashed #444; font-size:11px;">
          <td style="padding:5px 2px; text-align:left;">${index+1}. ${item.name}</td>
          <td style="padding:5px 2px; text-align:center;">${item.qty}.00</td>
          <td style="padding:5px 2px; text-align:right;">${parseFloat(item.custom_price).toFixed(2)}</td>
        </tr>
    `).join('');

    // Generate output formats to reflect selected print dimensions
    if (size === 'A4') {
        canvasNode.innerHTML = `
            <div style="background:#fff; color:#000; padding:10px; width:100%; min-width:320px;">
                <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:10px;">
                    <h2 style="margin:0; font-size:16px; font-weight:bold;">ALIF LUBRICANTS & AUTO SPARE PARTS</h2>
                    <p style="margin:2px 0; font-size:10px;">TIN: 0012345678 | Tel: +251911234567</p>
                    <p style="margin:2px 0; font-size:10px;">Addis Ababa, Ethiopia</p>
                </div>
                <h3 style="text-align:center; font-size:12px; font-weight:bold; text-decoration:underline; margin:5px 0;">${labelTitle} ATTACHMENT</h3>
                <p style="font-size:10px; margin:2px 0;"><b>Invoice Ref No:</b> ${data.invoice_number}</p>
                <p style="font-size:10px; margin:2px 0;"><b>Date Processed:</b> ${timestampString}</p>
                <p style="font-size:10px; margin:2px 0;"><b>Payment Logic:</b> ${data.payment_method} Ledger Account</p>
                <table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:11px;">
                    <tr style="background:#eee; border-top:1px solid #000; border-bottom:1px solid #000;"><th style="text-align:left; padding:4px;">Item Line</th><th style="text-align:center; padding:4px;">Qty</th><th style="text-align:right; padding:4px;">Price</th></tr>
                    <tbody>${tableRowsMap}</tbody>
                </table>
                <div style="margin-top:10px; text-align:right; font-size:10px; font-weight:bold;">
                    <p>Subtotal Amount: ${parseFloat(data.subtotal).toFixed(2)} ETB</p>
                    <p>VAT Contribution (15%): ${parseFloat(data.vat_amount).toFixed(2)} ETB</p>
                    <p style="font-size:12px; border-top:1px solid #000; padding-top:2px;">Aggregate Valuation: ${parseFloat(data.grand_total).toFixed(2)} ETB</p>
                </div>
            </div>
        `;
    } else {
        // High-density thermal form mappings matching baseline ERCA requirements
        canvasNode.innerHTML = `
            <div style="background:#fff; color:#000; padding:2px; max-width:260px; font-family:monospace; font-size:11px;">
                <div style="text-align:center; font-weight:bold;">
                    <h3 style="margin:0; font-size:13px;">ALIF LUBRICANTS</h3>
                    <p style="margin:2px 0; font-size:9px;">ADDIS ABABA, ETHIOPIA</p>
                    <p style="margin:2px 0;">============================</p>
                    <p style="margin:2px 0;">${labelTitle}</p>
                </div>
                <p style="margin:4px 0 2px 0; font-size:9px;"><b>FS NO:</b> FS-${data.invoice_number.split('-').pop()}</p>
                <p style="margin:2px 0; font-size:9px;"><b>DATE:</b> ${timestampString}</p>
                <p style="margin:2px 0; font-size:9px;"><b>CASHIER:</b> Operator Context</p>
                <p style="margin:2px 0;">----------------------------</p>
                <table style="width:100%; border-collapse:collapse; font-size:10px;">
                    ${tableRowsMap}
                </table>
                <p style="margin:2px 0;">----------------------------</p>
                <div style="font-size:10px; text-align:right;">
                    <div>TXBL AMT: ${parseFloat(data.subtotal).toFixed(2)}</div>
                    <div>VAT 15%: ${parseFloat(data.vat_amount).toFixed(2)}</div>
                    <div style="font-weight:bold; font-size:11px; border-top:1px solid #000; margin-top:2px; padding-top:2px;">TOTAL: ${parseFloat(data.grand_total).toFixed(2)} ETB</div>
                </div>
                <p style="text-align:center; margin-top:10px; font-size:9px; font-weight:bold;">THANK YOU / አመሰግናለሁ!</p>
            </div>
        `;
    }
    
    window.activeCanvasDataReference = data;
    document.getElementById('print-matrix-modal').classList.remove('hidden');
}

function closeDocumentSheetModal() {
    document.getElementById('print-matrix-modal').classList.add('hidden');
}

function compileToImageOutput() {
    const nodes = document.getElementById('capture-render-bounds');
    html2canvas(nodes, { scale: 3 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Invoice-${window.activeCanvasDataReference.invoice_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function compileToPdfDocument() {
    const nodes = document.getElementById('capture-render-bounds');
    html2canvas(nodes, { scale: 2 }).then(canvas => {
        const payload = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const documentInstance = new jsPDF('p', 'mm', 'a4');
        documentInstance.addImage(payload, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
        documentInstance.save(`Document-${window.activeCanvasDataReference.invoice_number}.pdf`);
    });
}

function handleSystemLogout() {
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('alif_auth_token')}` }
    }).finally(() => {
        localStorage.clear();
        window.location.href = '/views/login.html';
    });
}