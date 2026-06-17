let responseCacheBuffer = [];
let localCartMemoryStore = [];

async function executeLiveStockVerificationLookup() {
    const fieldString = document.getElementById('pos-search-input').value;
    const dropdownNode = document.getElementById('validation-dropdown-box');
    
    if (!fieldString.trim()) {
        dropdownNode.classList.add('hidden');
        return;
    }

    try {
        const stream = await fetch(`/api/products?search=${encodeURIComponent(fieldString)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('alif_auth_token')}` }
        });
        responseCacheBuffer = await stream.json();

        if (responseCacheBuffer.length === 0) {
            dropdownNode.innerHTML = '<p class="p-3 text-slate-500 text-center text-xs italic">No matching components located.</p>';
            dropdownNode.classList.remove('hidden');
            return;
        }

        dropdownNode.innerHTML = responseCacheBuffer.map(item => `
            <div onclick="appendItemToCartWorkspace(${item.id})" class="p-3 flex justify-between items-center text-xs hover:bg-emerald-950/40 cursor-pointer transition-all">
                <div>
                    <p class="font-black text-slate-200">${item.name}</p>
                    <p class="text-[10px] text-slate-400 font-mono">${item.sku} | Brand: ${item.brand || 'Generic'} | Stock Available: <span class="font-bold text-slate-200">${item.current_stock} pcs</span></p>
                </div>
                <span class="text-xs font-mono font-black text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">${parseFloat(item.selling_price).toFixed(2)} ETB</span>
            </div>
        `).join('');
        dropdownNode.classList.remove('hidden');
    } catch(err) {
        console.error("Lookup execution vector error status:", err);
    }
}

function appendItemToCartWorkspace(id) {
    const match = responseCacheBuffer.find(i => i.id === id);
    if (!match) return;

    if (match.current_stock <= 0) {
        alert("Transaction Aborted: Designated inventory location records zero units in stock.");
        return;
    }

    const duplicateInstance = localCartMemoryStore.find(i => i.id === id);
    if (duplicateInstance) {
        if (duplicateInstance.qty + 1 > match.current_stock) {
            alert("Bounds Limit Fault: Outbound request exceeds allocated stock volume metrics.");
            return;
        }
        duplicateInstance.qty++;
    } else {
        localCartMemoryStore.push({ ...match, qty: 1, custom_price: match.selling_price });
    }

    document.getElementById('pos-search-input').value = '';
    document.getElementById('validation-dropdown-box').classList.add('hidden');
    
    refreshCartWorkspaceDisplay();
}

function alterCartItemQuantity(id, stepDelta) {
    const index = localCartMemoryStore.find(i => i.id === id);
    if (index) {
        index.qty += stepDelta;
        if (index.qty <= 0) {
            localCartMemoryStore = localCartMemoryStore.filter(i => i.id !== id);
        }
    }
    refreshCartWorkspaceDisplay();
}

function manuallyOverrideItemPrice(id, values) {
    const target = localCartMemoryStore.find(i => i.id === id);
    if (target) {
        target.custom_price = parseFloat(values) || 0;
    }
    recalculateCartAggregationMetrics();
}

function refreshCartWorkspaceDisplay() {
    const container = document.getElementById('cart-items-stack-wrapper');
    document.getElementById('cart-counter-node').innerText = `${localCartMemoryStore.length} Items`;

    if (localCartMemoryStore.length === 0) {
        container.innerHTML = '<p class="text-slate-600 text-center py-12 text-xs italic">Empty workspace configuration context.</p>';
        document.getElementById('aggregated-total-node').innerText = '0.00 ETB';
        return;
    }

    container.innerHTML = localCartMemoryStore.map(item => `
        <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-2">
            <div class="flex justify-between items-center">
                <span class="font-black text-slate-200 truncate max-w-[140px]">${item.name}</span>
                <div class="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5">
                    <button onclick="alterCartItemQuantity(${item.id}, -1)" class="bg-slate-800 text-white w-4 h-4 rounded font-bold">-</button>
                    <span class="font-mono px-1 w-4 text-center">${item.qty}</span>
                    <button onclick="alterCartItemQuantity(${item.id}, 1)" class="bg-slate-800 text-white w-4 h-4 rounded font-bold">+</button>
                </div>
            </div>
            <div class="flex justify-between items-center border-t border-slate-900/40 pt-1.5">
                <div class="flex items-center gap-1">
                    <span class="text-slate-500 text-[9px]">MUTABLE PRICE:</span>
                    <input type="number" value="${item.custom_price}" oninput="manuallyOverrideItemPrice(${item.id}, this.value)" class="w-16 bg-slate-900 border border-slate-700 text-center font-mono font-bold text-emerald-400 rounded">
                </div>
                <span class="font-mono text-slate-300 font-bold">${(item.custom_price * item.qty).toFixed(2)}</span>
            </div>
        </div>
    `).join('');

    recalculateCartAggregationMetrics();
}

function recalculateCartAggregationMetrics() {
    const calculationSum = localCartMemoryStore.reduce((total, element) => total + (element.custom_price * element.qty), 0);
    document.getElementById('aggregated-total-node').innerText = (calculationSum * 1.15).toFixed(2) + " ETB";
}

async function commitActiveCartSaleToPipeline() {
    if (localCartMemoryStore.length === 0) return alert("Operation rejected: Active memory cart structural registers are empty.");

    const structuralPayload = {
        cart: localCartMemoryStore,
        payment_method: document.getElementById('checkout-payment-channel').value,
        order_type: document.getElementById('checkout-profile-type').value,
        customer_id: 1
    };

    try {
        const routeResponse = await fetch('/api/sales', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('alif_auth_token')}`
            },
            body: JSON.stringify(structuralPayload)
        });

        const interpretationResult = await routeResponse.json();

        if (interpretationResult.success) {
            const documentPrintPreference = confirm("Transaction Ledger Frame Saved.\n\nSelect Legal Document Specifications:\n- OK -> A4 System Attachment Layout\n- Cancel -> 80mm High-Density Thermal Strip");
            
            // Dispatch structural payload message to parent shell framework layout view boundaries
            window.parent.postMessage({
                type: 'SHOW_RECEIPT',
                data: interpretationResult,
                size: documentPrintPreference ? 'A4' : 'Thermal',
                cart: localCartMemoryStore
            }, '*');

            localCartMemoryStore = [];
            refreshCartWorkspaceDisplay();
        } else {
            alert(`Pipeline Fault Notification: ${interpretationResult.error}`);
        }
    } catch (pipelineEx) {
        alert("System Routing Latency Exception Intercepted.");
    }
}

// Global click event to catch dropdown escapes cleanly
document.addEventListener('click', function(e) {
    if (e.target.id !== 'pos-search-input') {
        document.getElementById('validation-dropdown-box').classList.add('hidden');
    }
});