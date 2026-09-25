/**
 * SIVAKASI CRACKERS BILLING & INVOICE ENGINE
 * Pure Vanilla JavaScript Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    cart: {}, // productId -> quantity
    activeCategory: 'ALL',
    invoice: {
      date: getTodayDateString(),
      invoiceNo: generateInvoiceNumber(),
      paymentMode: 'Cash'
    }
  };

  // DOM Elements
  const orderTableBody = document.getElementById('orderTableBody');
  const categoryPillsContainer = document.getElementById('categoryPills');
  
  // Dynamic Stats Summary Elements
  const statTotalItems = document.getElementById('statTotalItems');
  const statTotalMRP = document.getElementById('statTotalMRP');
  const statTotalSavings = document.getElementById('statTotalSavings');
  const statNetPayable = document.getElementById('statNetPayable');
  
  // Minimal Top Bar Inputs
  const invDateInput = document.getElementById('invDate');
  const paymentModeInput = document.getElementById('paymentMode');

  // Live Invoice Sheet Elements
  const invSheetNo = document.getElementById('invSheetNo');
  const invSheetDate = document.getElementById('invSheetDate');
  const invSheetPayMode = document.getElementById('invSheetPayMode');
  const invTableBody = document.getElementById('invTableBody');
  const invSubTotalMrp = document.getElementById('invSubTotalMrp');
  const invTotalSavings = document.getElementById('invTotalSavings');
  const invNetPayable = document.getElementById('invNetPayable');
  const invAmountWords = document.getElementById('invAmountWords');

  // Preview Modal Elements
  const previewModal = document.getElementById('previewModal');
  const modalA4BillContainer = document.getElementById('modalA4BillContainer');
  const btnPreviewBill = document.getElementById('btnPreviewBill');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalCloseCross = document.getElementById('btnModalCloseCross');
  const btnModalPrint = document.getElementById('btnModalPrint');
  const btnModalDownload = document.getElementById('btnModalDownload');

  // Sales History Modal Elements
  const salesHistoryModal = document.getElementById('salesHistoryModal');
  const btnSalesHistory = document.getElementById('btnSalesHistory');
  const btnHistoryClose = document.getElementById('btnHistoryClose');
  const btnHistoryCloseCross = document.getElementById('btnHistoryCloseCross');
  const historyDateInput = document.getElementById('historyDateInput');
  const historyFilterPills = document.getElementById('historyFilterPills');
  const histTotalCount = document.getElementById('histTotalCount');
  const histTotalRevenue = document.getElementById('histTotalRevenue');
  const historyTableBody = document.getElementById('historyTableBody');

  // Action Buttons
  const btnClear = document.getElementById('btnClearAll');

  let activeHistoryRange = 'all';

  // Initialize App
  init();

  function init() {
    setupCategoryPills();
    setupTopBarListeners();
    renderOrderTable();
    updateCalculations();
    setupEventListeners();
    setupModalEventListeners();
    setupHistoryEventListeners();
    
    // Default today's date
    if (invDateInput) invDateInput.value = state.invoice.date;
  }

  // Generate today's date formatted (YYYY-MM-DD)
  function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Format date to DD/MM/YYYY for invoice
  function formatDateForInvoice(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Generate unique Sivakasi invoice bill number
  function generateInvoiceNumber() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `SVK-${year}-${randomNum}`;
  }

  // Build Category Pill Buttons
  function setupCategoryPills() {
    if (!categoryPillsContainer) return;
    
    let html = `<button class="pill-btn active" data-category="ALL">💥 ALL CATEGORIES</button>`;
    
    CRACKERS_CATALOG.forEach(cat => {
      const shortName = cat.category.split('/')[0].trim();
      html += `<button class="pill-btn" data-category="${cat.category}">${shortName}</button>`;
    });
    
    categoryPillsContainer.innerHTML = html;

    categoryPillsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('pill-btn')) {
        document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        state.activeCategory = e.target.dataset.category;
        renderOrderTable();
      }
    });
  }

  // Listen to Top Bar Changes (Date & Payment Mode)
  function setupTopBarListeners() {
    if (invDateInput) {
      invDateInput.addEventListener('change', (e) => {
        state.invoice.date = e.target.value;
        renderLiveInvoice();
      });
    }
    if (paymentModeInput) {
      paymentModeInput.addEventListener('change', (e) => {
        state.invoice.paymentMode = e.target.value;
        renderLiveInvoice();
      });
    }
  }

  // Action Button Handlers
  function setupEventListeners() {
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (Object.keys(state.cart).length === 0) {
          showToast('Cart is already empty!');
          return;
        }
        state.cart = {};
        state.invoice.invoiceNo = generateInvoiceNumber(); // Generate fresh bill no
        renderOrderTable();
        updateCalculations();
        showToast('All quantities reset & new bill created!');
      });
    }
  }

  // Modal Event Handlers
  function setupModalEventListeners() {
    if (btnPreviewBill) {
      btnPreviewBill.addEventListener('click', openPreviewModal);
    }

    if (btnModalClose) {
      btnModalClose.addEventListener('click', closePreviewModal);
    }

    if (btnModalCloseCross) {
      btnModalCloseCross.addEventListener('click', closePreviewModal);
    }

    if (btnModalPrint) {
      btnModalPrint.addEventListener('click', () => {
        saveCurrentInvoiceToHistory();
        window.print();
      });
    }

    if (btnModalDownload) {
      btnModalDownload.addEventListener('click', () => {
        saveCurrentInvoiceToHistory();
        downloadPDF();
      });
    }

    if (previewModal) {
      previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
          closePreviewModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (previewModal && !previewModal.classList.contains('hidden')) {
          closePreviewModal();
        } else if (salesHistoryModal && !salesHistoryModal.classList.contains('hidden')) {
          closeSalesHistoryModal();
        }
      }
    });
  }

  // Sales History Event Listeners & Logic
  function setupHistoryEventListeners() {
    if (btnSalesHistory) {
      btnSalesHistory.addEventListener('click', openSalesHistoryModal);
    }
    if (btnHistoryClose) {
      btnHistoryClose.addEventListener('click', closeSalesHistoryModal);
    }
    if (btnHistoryCloseCross) {
      btnHistoryCloseCross.addEventListener('click', closeSalesHistoryModal);
    }
    if (salesHistoryModal) {
      salesHistoryModal.addEventListener('click', (e) => {
        if (e.target === salesHistoryModal) closeSalesHistoryModal();
      });
    }

    if (historyDateInput) {
      historyDateInput.addEventListener('change', (e) => {
        activeHistoryRange = 'custom';
        updateHistoryPillSelection();
        renderSalesHistory();
      });
    }

    if (historyFilterPills) {
      historyFilterPills.addEventListener('click', (e) => {
        if (e.target.classList.contains('pill-btn')) {
          activeHistoryRange = e.target.dataset.range;
          if (historyDateInput) historyDateInput.value = '';
          updateHistoryPillSelection();
          renderSalesHistory();
        }
      });
    }
  }

  function updateHistoryPillSelection() {
    if (!historyFilterPills) return;
    historyFilterPills.querySelectorAll('.pill-btn').forEach(btn => {
      if (btn.dataset.range === activeHistoryRange) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function openSalesHistoryModal() {
    if (!salesHistoryModal) return;
    renderSalesHistory();
    salesHistoryModal.classList.remove('hidden');
    void salesHistoryModal.offsetWidth;
    salesHistoryModal.classList.add('show');
  }

  function closeSalesHistoryModal() {
    if (!salesHistoryModal) return;
    salesHistoryModal.classList.remove('show');
    setTimeout(() => {
      salesHistoryModal.classList.add('hidden');
    }, 200);
  }

  function getSalesHistoryFromStorage() {
    try {
      const saved = localStorage.getItem('sivakasi_sales_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading sales history:', e);
      return [];
    }
  }

  // Save current active invoice to localStorage sales history
  function saveCurrentInvoiceToHistory() {
    const selectedItems = [];
    let totalItems = 0;
    let totalActualMRP = 0;
    let netPayable = 0;

    Object.keys(state.cart).forEach(id => {
      const qty = state.cart[id];
      const item = findItemById(id);
      if (item && qty > 0) {
        totalItems += qty;
        totalActualMRP += (item.mrp * qty);
        netPayable += (item.price * qty);
        selectedItems.push({
          code: item.code,
          name: item.name,
          tamilName: item.tamilName,
          unit: item.unit,
          qty: qty,
          mrp: item.mrp,
          rate: item.price,
          total: qty * item.price
        });
      }
    });

    if (selectedItems.length === 0) return; // Do not save empty bills

    const totalSavings = totalActualMRP - netPayable;
    const now = new Date();

    const historyRecord = {
      id: state.invoice.invoiceNo || generateInvoiceNumber(),
      date: state.invoice.date,
      timestamp: now.toISOString(),
      displayDate: formatDateForInvoice(state.invoice.date),
      displayTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      paymentMode: state.invoice.paymentMode || 'Cash',
      itemsCount: totalItems,
      totalMRP: totalActualMRP,
      totalSavings: totalSavings,
      netPayable: netPayable,
      items: selectedItems,
      cart: JSON.parse(JSON.stringify(state.cart))
    };

    let history = getSalesHistoryFromStorage();
    const existingIndex = history.findIndex(h => h.id === historyRecord.id);
    if (existingIndex >= 0) {
      history[existingIndex] = historyRecord;
    } else {
      history.unshift(historyRecord);
    }

    try {
      localStorage.setItem('sivakasi_sales_history', JSON.stringify(history));
    } catch (e) {
      console.error('Error saving sales history:', e);
    }
  }

  function renderSalesHistory() {
    const allHistory = getSalesHistoryFromStorage();
    const filteredHistory = filterHistoryByRange(allHistory, activeHistoryRange, historyDateInput ? historyDateInput.value : '');

    let totalCount = filteredHistory.length;
    let totalRevenue = 0;
    filteredHistory.forEach(h => totalRevenue += (h.netPayable || 0));

    if (histTotalCount) histTotalCount.textContent = totalCount;
    if (histTotalRevenue) histTotalRevenue.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

    if (!historyTableBody) return;

    if (filteredHistory.length === 0) {
      historyTableBody.innerHTML = `
        <tr class="history-empty-row">
          <td colspan="6">
            📜 No sales history records found for the selected date filter.<br>
            Generate, preview, or download bills to populate sales history!
          </td>
        </tr>
      `;
      return;
    }

    let rowsHTML = '';
    filteredHistory.forEach(h => {
      rowsHTML += `
        <tr>
          <td><strong style="font-family: monospace; color: var(--sivakasi-purple-dark);">${h.id}</strong></td>
          <td>
            ${h.displayDate || h.date} 
            <span style="font-size: 0.7rem; color: #64748b; font-weight: 500;">(${h.displayTime || ''})</span>
          </td>
          <td class="text-center" style="font-weight: 700;">${h.itemsCount || 0}</td>
          <td><span style="font-size: 0.72rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${h.paymentMode || 'Cash'}</span></td>
          <td class="text-right" style="font-weight: 800; color: #059669;">₹${(h.netPayable || 0).toLocaleString('en-IN')}</td>
          <td class="text-center">
            <div class="history-actions">
              <button class="btn btn-purple btn-xs btn-view-hist" data-id="${h.id}">View Bill</button>
              <button class="btn btn-outline-danger btn-xs btn-delete-hist" data-id="${h.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });

    historyTableBody.innerHTML = rowsHTML;
    attachHistoryTableListeners();
  }

  function filterHistoryByRange(history, range, customDateVal) {
    if (range === 'custom' && customDateVal) {
      return history.filter(h => h.date === customDateVal);
    }

    const todayStr = getTodayDateString();
    const todayDate = new Date();

    if (range === 'today') {
      return history.filter(h => h.date === todayStr);
    } else if (range === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(todayDate.getDate() - 7);
      return history.filter(h => new Date(h.date || h.timestamp) >= oneWeekAgo);
    } else if (range === 'month') {
      const currentYearMonth = todayStr.substring(0, 7); // YYYY-MM
      return history.filter(h => h.date && h.date.startsWith(currentYearMonth));
    }

    return history; // 'all'
  }

  function attachHistoryTableListeners() {
    document.querySelectorAll('.btn-view-hist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const allHistory = getSalesHistoryFromStorage();
        const record = allHistory.find(h => h.id === id);
        if (record) {
          state.invoice.invoiceNo = record.id;
          state.invoice.date = record.date;
          state.invoice.paymentMode = record.paymentMode;
          state.cart = JSON.parse(JSON.stringify(record.cart || {}));

          if (invDateInput) invDateInput.value = record.date;
          if (paymentModeInput) paymentModeInput.value = record.paymentMode;

          renderOrderTable();
          updateCalculations();
          closeSalesHistoryModal();
          setTimeout(() => {
            openPreviewModal();
            showToast(`Loaded Bill ${record.id}`);
          }, 250);
        }
      });
    });

    document.querySelectorAll('.btn-delete-hist').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (confirm(`Are you sure you want to delete Bill ${id} from sales history?`)) {
          let allHistory = getSalesHistoryFromStorage();
          allHistory = allHistory.filter(h => h.id !== id);
          localStorage.setItem('sivakasi_sales_history', JSON.stringify(allHistory));
          renderSalesHistory();
          showToast(`Deleted Bill ${id}`);
        }
      });
    });
  }

  // Open Preview Modal
  function openPreviewModal() {
    if (!previewModal || !modalA4BillContainer) return;

    const sourceA4Bill = document.getElementById('printableA4Bill');
    if (sourceA4Bill) {
      modalA4BillContainer.innerHTML = sourceA4Bill.outerHTML;
    }

    previewModal.classList.remove('hidden');
    void previewModal.offsetWidth;
    previewModal.classList.add('show');
  }

  // Close Preview Modal
  function closePreviewModal() {
    if (!previewModal) return;
    previewModal.classList.remove('show');
    setTimeout(() => {
      previewModal.classList.add('hidden');
    }, 200);
  }

  // Download PDF Function - Direct 1:1 Capture of Live Invoice Preview DOM
  function downloadPDF() {
    const element = document.querySelector('#modalA4BillContainer .a4-sheet') || document.getElementById('printableA4Bill');
    if (!element) return;

    showToast('Generating Crackers_Invoice.pdf...');

    if (typeof html2pdf === 'undefined') {
      window.print();
      return;
    }

    const generate = () => {
      const opt = {
        margin:       [4, 4, 4, 4],
        filename:     'Crackers_Invoice.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        showToast('PDF downloaded successfully!');
      }).catch(err => {
        console.error('PDF export error:', err);
        window.print();
      });
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(generate);
    } else {
      generate();
    }
  }

  // Load Preset Demo Order Data
  function loadDemoData() {
    state.cart = {
      'spk-02': 2, // 10 cm Electric Sparklers x 2
      'flp-03': 1, // Flower Pots Special x 1
      'chk-03': 2, // Ground Chakkara Deluxe x 2
      'rkt-02': 1, // Bomb Rocket x 1
      'sky-01': 1  // 7 Shots Aerial x 1
    };
    renderOrderTable();
    updateCalculations();
    showToast('Loaded sample Sivakasi order!');
  }

  // Render Interactive Crackers Table with ITEM CODE
  function renderOrderTable() {
    if (!orderTableBody) return;

    let rowsHTML = '';

    CRACKERS_CATALOG.forEach(cat => {
      if (state.activeCategory !== 'ALL' && state.activeCategory !== cat.category) {
        return;
      }

      rowsHTML += `
        <tr class="category-banner-row">
          <td colspan="7">
            <div class="category-banner-content">
              <span class="category-title">🔥 ${cat.category}</span>
              <span style="font-size: 0.75rem; font-weight: 600;">FACTORY DISCOUNT APPLIED</span>
            </div>
          </td>
        </tr>
      `;

      cat.items.forEach(item => {
        const qty = state.cart[item.id] || 0;
        const total = qty * item.price;
        const hasQtyClass = qty > 0 ? 'has-qty' : '';

        rowsHTML += `
          <tr class="item-row ${hasQtyClass}" data-id="${item.id}">
            <td class="col-code">
              ${item.code}
            </td>
            <td class="col-name">
              ${item.name}
              <span class="tamil-sub">${item.tamilName}</span>
            </td>
            <td class="col-mrp">
              <span class="unit-tag">${item.unit}</span>
              <span class="mrp-struck">₹${item.mrp.toLocaleString('en-IN')}</span>
            </td>
            <td class="col-price">
              ₹${item.price.toLocaleString('en-IN')}
            </td>
            <td class="col-qty">
              <div class="qty-control">
                <button type="button" class="qty-btn btn-minus" data-id="${item.id}">-</button>
                <input type="number" class="qty-input" data-id="${item.id}" value="${qty}" min="0" max="999">
                <button type="button" class="qty-btn btn-plus" data-id="${item.id}">+</button>
              </div>
            </td>
            <td class="col-total">
              ₹${total.toLocaleString('en-IN')}
            </td>
          </tr>
        `;
      });
    });

    orderTableBody.innerHTML = rowsHTML;
    attachTableListeners();
  }

  // Attach Event Listeners to Quantity Inputs & Stepper Buttons
  function attachTableListeners() {
    document.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const currentQty = state.cart[id] || 0;
        if (currentQty > 0) {
          state.cart[id] = currentQty - 1;
          if (state.cart[id] === 0) delete state.cart[id];
          updateRowUI(id);
          updateCalculations();
        }
      });
    });

    document.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const currentQty = state.cart[id] || 0;
        state.cart[id] = currentQty + 1;
        updateRowUI(id);
        updateCalculations();
      });
    });

    document.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.dataset.id;
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        
        if (val === 0) {
          delete state.cart[id];
        } else {
          state.cart[id] = val;
        }
        updateRowUI(id);
        updateCalculations();
      });

      input.addEventListener('focus', (e) => {
        e.target.select();
      });
    });
  }

  // Fast Row UI update without re-rendering entire table DOM
  function updateRowUI(productId) {
    const row = document.querySelector(`tr[data-id="${productId}"]`);
    if (!row) return;

    const qty = state.cart[productId] || 0;
    const item = findItemById(productId);
    if (!item) return;

    const input = row.querySelector('.qty-input');
    if (input && parseInt(input.value, 10) !== qty) {
      input.value = qty;
    }

    const colTotal = row.querySelector('.col-total');
    if (colTotal) {
      colTotal.textContent = `₹${(qty * item.price).toLocaleString('en-IN')}`;
    }

    if (qty > 0) {
      row.classList.add('has-qty');
    } else {
      row.classList.remove('has-qty');
    }
  }

  function findItemById(id) {
    for (const cat of CRACKERS_CATALOG) {
      const item = cat.items.find(i => i.id === id);
      if (item) return item;
    }
    return null;
  }

  // Recalculate Totals & Update Live Invoice Sheet
  function updateCalculations() {
    let totalItems = 0;
    let totalActualMRP = 0;
    let netPayable = 0;

    Object.keys(state.cart).forEach(id => {
      const qty = state.cart[id];
      const item = findItemById(id);
      if (item && qty > 0) {
        totalItems += qty;
        totalActualMRP += (item.mrp * qty);
        netPayable += (item.price * qty);
      }
    });

    const totalSavings = totalActualMRP - netPayable;

    // Update Summary Bar
    if (statTotalItems) statTotalItems.textContent = totalItems;
    if (statTotalMRP) statTotalMRP.textContent = `₹${totalActualMRP.toLocaleString('en-IN')}`;
    if (statTotalSavings) statTotalSavings.textContent = `₹${totalSavings.toLocaleString('en-IN')}`;
    if (statNetPayable) statNetPayable.textContent = `₹${netPayable.toLocaleString('en-IN')}`;

    // Update Right Panel Live A4 Invoice Sheet
    renderLiveInvoice(totalActualMRP, totalSavings, netPayable);
  }

  // Render Live A4 Invoice Sheet
  function renderLiveInvoice(totalActualMRP = 0, totalSavings = 0, netPayable = 0) {
    if (invSheetNo) invSheetNo.textContent = state.invoice.invoiceNo || 'SVK-2026-1001';
    if (invSheetDate) invSheetDate.textContent = formatDateForInvoice(state.invoice.date);
    if (invSheetPayMode) invSheetPayMode.textContent = state.invoice.paymentMode || 'Cash';

    const selectedItems = [];
    let srNo = 1;

    Object.keys(state.cart).forEach(id => {
      const qty = state.cart[id];
      const item = findItemById(id);
      if (item && qty > 0) {
        selectedItems.push({
          srNo: srNo++,
          code: item.code,
          name: item.name,
          tamilName: item.tamilName,
          unit: item.unit,
          qty: qty,
          mrp: item.mrp,
          rate: item.price,
          total: qty * item.price
        });
      }
    });

    // Dynamic A4 Sheet Scaling: Auto add/remove compact-bill based on row count
    const printableBillSheet = document.getElementById('printableA4Bill');
    if (printableBillSheet) {
      if (selectedItems.length > 15) {
        printableBillSheet.classList.add('compact-bill');
      } else {
        printableBillSheet.classList.remove('compact-bill');
      }
    }

    if (!invTableBody) return;

    if (selectedItems.length === 0) {
      invTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="inv-empty-msg">
              🛒 No crackers selected yet.<br>
              Add item quantities in the table on the left to see your live A4 bill preview!
            </div>
          </td>
        </tr>
      `;
    } else {
      let invHTML = '';
      selectedItems.forEach(item => {
        invHTML += `
          <tr>
            <td class="text-center" style="font-weight: 600;">${item.srNo}</td>
            <td>
              <strong>${item.name}</strong> <span style="font-size: 0.68rem; color: #64748b; font-family: monospace;">(#${item.code})</span>
              <div style="font-size: 0.68rem; color: #475569; font-family: 'Noto Sans Tamil', sans-serif;">${item.tamilName}</div>
            </td>
            <td class="text-center col-packing">${item.unit}</td>
            <td class="text-center" style="font-weight: 700;">${item.qty}</td>
            <td class="text-right">₹${item.rate.toLocaleString('en-IN')}</td>
            <td class="text-right" style="font-weight: 700;">₹${item.total.toLocaleString('en-IN')}</td>
          </tr>
        `;
      });
      invTableBody.innerHTML = invHTML;
    }

    if (invSubTotalMrp) invSubTotalMrp.textContent = `₹${totalActualMRP.toLocaleString('en-IN')}`;
    if (invTotalSavings) invTotalSavings.textContent = `- ₹${totalSavings.toLocaleString('en-IN')}`;
    if (invNetPayable) invNetPayable.textContent = `₹${netPayable.toLocaleString('en-IN')}`;
    if (invAmountWords) {
      invAmountWords.textContent = netPayable > 0 ? `${numberToWords(netPayable)} Only` : 'Rupees Zero Only';
    }

    // If modal is open, sync modal body live
    if (previewModal && previewModal.classList.contains('show') && modalA4BillContainer) {
      const sourceA4Bill = document.getElementById('printableA4Bill');
      if (sourceA4Bill) {
        modalA4BillContainer.innerHTML = sourceA4Bill.outerHTML;
      }
    }
  }

  // Indian Currency Number to Words Converter
  function numberToWords(amount) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(num) {
      if ((num = num.toString()).length > 9) return 'overflow';
      const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return '';
      let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str.trim();
    }

    const words = inWords(amount);
    return words ? `Rupees ${words}` : 'Rupees Zero';
  }

  // Toast Notification Helper
  function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `✨ <span>${message}</span>`;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
