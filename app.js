document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'settleMateStateV18';

  const HUMAN_AVATARS = ['👨', '👩', '🧑', '👦', '👧', '🧔', '👴', '👵', '👨‍🦱', '👩‍🦱', '👨‍🦰', '👩‍🦰', '👨‍🦳', '👩‍🦳', '🧔‍♂️', '🧔‍♀️'];

  function getRandomHumanAvatar(name) {
    if (!name) return HUMAN_AVATARS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % HUMAN_AVATARS.length;
    return HUMAN_AVATARS[index];
  }

  const SCENARIO_PRESETS = {
    restaurant: { taxPct: 5, servicePct: 10, discountPct: 0 },
    trip: { taxPct: 18, servicePct: 0, discountPct: 0 },
    shopping: { taxPct: 12, servicePct: 0, discountPct: 5 },
    roommates: { taxPct: 0, servicePct: 0, discountPct: 0 },
    custom: { taxPct: 0, servicePct: 0, discountPct: 0 }
  };

  const defaultState = {
    currency: '₹',
    participants: [],
    customShares: {},
    payments: {},
    paidStatuses: {},
    individualTips: {},
    tipMode: 'equal',
    autoRounding: false,
    items: [],
    billDetails: { base: 0, taxPct: 5, servicePct: 10, discountPct: 0, tip: 0 },
    stackedBills: [],
    splitMethod: 'equal',
    groups: {},
    history: [],
    currentStatus: 'Pending',
    scenario: 'restaurant',
    customScenarioName: '',
    placeVisited: '',
    lastCalculatedTransactions: [],
    lastMemberMetrics: {},
    scannedBillImageData: null,
    currentWizardStep: 1,
    editingHistoryId: null,
    isStackingEnabled: false
  };

  let state = defaultState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) state = { ...defaultState, ...parsed };
    }
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // DOM Elements
  const errorBox = document.getElementById('error-box');
  const billScanInput = document.getElementById('bill-scan-input');
  const scannedBillPreview = document.getElementById('scanned-bill-preview');
  const scannedBillImg = document.getElementById('scanned-bill-img');
  const removeScannedBillBtn = document.getElementById('remove-scanned-bill-btn');

  const avatarPicker = document.getElementById('avatar-picker');
  const participantInput = document.getElementById('participant-name-input');
  const addBtn = document.getElementById('add-participant-btn');
  const participantList = document.getElementById('participant-list');
  const participantCount = document.getElementById('participant-count');

  const topGrandTotal = document.getElementById('top-grand-total');
  const topBillsCount = document.getElementById('top-bills-count');
  const topPaidProgress = document.getElementById('top-paid-progress');
  const topSettlementStatus = document.getElementById('top-settlement-status');

  const expenseSituationSelect = document.getElementById('expense-situation-select');
  const customScenarioInput = document.getElementById('custom-scenario-input');
  const placeVisitedInput = document.getElementById('place-visited-input');

  const groupSelect = document.getElementById('group-select');
  const loadGroupBtn = document.getElementById('load-group-btn');
  const deleteGroupBtn = document.getElementById('delete-group-btn');
  const groupNameInput = document.getElementById('group-name-input');
  const saveGroupBtn = document.getElementById('save-group-btn');

  const currencySelect = document.getElementById('currency-select');
  const manualBaseContainer = document.getElementById('manual-base-container');
  const baseBillInput = document.getElementById('base-bill-input');
  const taxInput = document.getElementById('tax-input');
  const serviceChargeInput = document.getElementById('service-charge-input');
  const discountInput = document.getElementById('discount-input');
  const tipInput = document.getElementById('tip-input');
  const tipModeSelect = document.getElementById('tip-mode-select');
  const roundingToggle = document.getElementById('rounding-toggle');
  const individualTipsContainer = document.getElementById('individual-tips-container');
  const individualTipsList = document.getElementById('individual-tips-list');
  const grandTotalVal = document.getElementById('grand-total-val');

  const enableStackToggle = document.getElementById('enable-stack-toggle');
  const stackPayerContainer = document.getElementById('stack-payer-container');

  const bsBase = document.getElementById('bs-base');
  const bsTax = document.getElementById('bs-tax');
  const bsTaxPct = document.getElementById('bs-tax-pct');
  const bsService = document.getElementById('bs-service');
  const bsServicePct = document.getElementById('bs-service-pct');
  const bsDiscount = document.getElementById('bs-discount');
  const bsDiscountPct = document.getElementById('bs-discount-pct');
  const bsTip = document.getElementById('bs-tip');

  const addBillToScenarioBtn = document.getElementById('add-bill-to-scenario-btn');
  const stackedBillsCount = document.getElementById('stacked-bills-count');
  const stackedBillsList = document.getElementById('stacked-bills-list');

  const valTotalBill = document.getElementById('val-total-bill');
  const valAssigned = document.getElementById('val-assigned');
  const valDiff = document.getElementById('val-diff');
  const valDiffContainer = document.getElementById('val-diff-container');
  const validationBadge = document.getElementById('validation-badge');

  const splitMethodSelect = document.getElementById('split-method-select');
  const customSplitContainer = document.getElementById('custom-split-container');
  const customSharesList = document.getElementById('custom-shares-list');

  const itemizedSplitContainer = document.getElementById('itemized-split-container');
  const itemNameInput = document.getElementById('item-name-input');
  const itemPriceInput = document.getElementById('item-price-input');
  const itemQtyInput = document.getElementById('item-qty-input');
  const itemPortionInputs = document.getElementById('item-portion-inputs');
  const addItemBtn = document.getElementById('add-item-btn');
  const syncBaseFromItemsBtn = document.getElementById('sync-base-from-items-btn');
  const itemsList = document.getElementById('items-list');

  const whoConsumedWhatContainer = document.getElementById('who-consumed-what-container');
  const paymentsList = document.getElementById('payments-list');
  
  const individualPaymentTrackerSection = document.getElementById('individual-payment-tracker-section');
  const individualPaymentTracker = document.getElementById('individual-payment-tracker');

  const gbTotalSpent = document.getElementById('gb-total-spent');
  const gbTotalCollected = document.getElementById('gb-total-collected');
  const gbNetDebt = document.getElementById('gb-net-debt');
  const groupBalanceList = document.getElementById('group-balance-list');

  const calculateBtn = document.getElementById('calculate-btn');
  const saveHistoryBtn = document.getElementById('save-history-btn');

  const resultsSection = document.getElementById('results-section');
  const settlementPlanList = document.getElementById('settlement-plan-list');
  const transactionSummaryBox = document.getElementById('transaction-summary-box');
  const settlementStatusBadge = document.getElementById('settlement-status-badge');
  const toggleSettledBtn = document.getElementById('toggle-settled-btn');
  const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
  const shareNativeBtn = document.getElementById('share-native-btn');

  const openQrBtn = document.getElementById('open-qr-btn');
  const qrModal = document.getElementById('qr-modal');
  const closeQrBtn = document.getElementById('close-qr-btn');
  const qrCodeBox = document.getElementById('qr-code-box');
  const qrVpaInput = document.getElementById('qr-vpa-input');
  const qrNameInput = document.getElementById('qr-name-input');
  const qrAmountInput = document.getElementById('qr-amount-input');

  const settledCelebrationScreen = document.getElementById('settled-celebration-screen');
  const dismissCelebrationBtn = document.getElementById('dismiss-celebration-btn');

  const dashboardsGrid = document.getElementById('dashboards-grid');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  function showWizardStep(stepNum) {
    state.currentWizardStep = stepNum;
    saveState();
    document.querySelectorAll('.wizard-step').forEach(stepEl => {
      if (parseInt(stepEl.dataset.step, 10) === stepNum) {
        stepEl.classList.remove('hidden');
      } else {
        stepEl.classList.add('hidden');
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.btn-next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.currentWizardStep === 2 && state.participants.length === 0) {
        return showError("❌ Please add at least one participant before proceeding.");
      }
      clearError();
      if (state.currentWizardStep < 4) {
        showWizardStep(state.currentWizardStep + 1);
      }
    });
  });

  document.querySelectorAll('.btn-prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
      clearError();
      if (state.currentWizardStep > 1) {
        showWizardStep(state.currentWizardStep - 1);
      }
    });
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }

  function clearError() {
    errorBox.style.display = 'none';
  }

  if (billScanInput) {
    billScanInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        clearError();
        const reader = new FileReader();
        reader.onload = function (event) {
          state.scannedBillImageData = event.target.result;
          saveState();
          renderScannedBillPreview();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removeScannedBillBtn) {
    removeScannedBillBtn.addEventListener('click', () => {
      state.scannedBillImageData = null;
      if (billScanInput) billScanInput.value = '';
      saveState();
      renderScannedBillPreview();
    });
  }

  function renderScannedBillPreview() {
    if (state.scannedBillImageData) {
      scannedBillImg.src = state.scannedBillImageData;
      scannedBillPreview.classList.remove('hidden');
    } else {
      scannedBillImg.src = '';
      scannedBillPreview.classList.add('hidden');
    }
  }

  currencySelect.addEventListener('change', (e) => {
    state.currency = e.target.value;
    saveState();
    renderAll();
  });

  roundingToggle.checked = state.autoRounding || false;
  roundingToggle.addEventListener('change', (e) => {
    state.autoRounding = e.target.checked;
    updateBillSummary();
    renderValidationBox();
    recalculateSharesInternal();
    saveState();
  });

  enableStackToggle.checked = state.isStackingEnabled || false;
  if (state.isStackingEnabled) {
    stackPayerContainer.classList.remove('hidden');
  } else {
    stackPayerContainer.classList.add('hidden');
  }

  enableStackToggle.addEventListener('change', (e) => {
    state.isStackingEnabled = e.target.checked;
    if (state.isStackingEnabled) {
      stackPayerContainer.classList.remove('hidden');
    } else {
      stackPayerContainer.classList.add('hidden');
    }
    saveState();
  });

  tipModeSelect.addEventListener('change', (e) => {
    state.tipMode = e.target.value;
    if (state.tipMode === 'individual') {
      individualTipsContainer.classList.remove('hidden');
    } else {
      individualTipsContainer.classList.add('hidden');
    }
    updateBillSummary();
    renderValidationBox();
    recalculateSharesInternal();
    saveState();
  });

  expenseSituationSelect.addEventListener('change', (e) => {
    state.scenario = e.target.value;
    if (e.target.value === 'custom') {
      customScenarioInput.classList.remove('hidden');
    } else {
      customScenarioInput.classList.add('hidden');
    }

    const preset = SCENARIO_PRESETS[e.target.value] || SCENARIO_PRESETS.custom;
    state.billDetails.taxPct = preset.taxPct;
    state.billDetails.servicePct = preset.servicePct;
    state.billDetails.discountPct = preset.discountPct;

    taxInput.value = preset.taxPct;
    serviceChargeInput.value = preset.servicePct;
    discountInput.value = preset.discountPct;

    updateBillSummary();
    renderValidationBox();
    recalculateSharesInternal();
    saveState();
  });

  customScenarioInput.addEventListener('input', (e) => {
    state.customScenarioName = e.target.value.trim();
    saveState();
  });

  placeVisitedInput.addEventListener('input', (e) => {
    state.placeVisited = e.target.value.trim();
    saveState();
  });

  function renderGroupDropdown() {
    groupSelect.innerHTML = '<option value="">-- Select Saved Group --</option>';
    Object.keys(state.groups).forEach(gName => {
      const opt = document.createElement('option');
      opt.value = gName;
      const membersStr = state.groups[gName].map(m => m.name || m).join(', ');
      opt.textContent = `${gName} (${membersStr})`;
      groupSelect.appendChild(opt);
    });
  }

  saveGroupBtn.addEventListener('click', () => {
    clearError();
    const gName = groupNameInput.value.trim();
    if (!gName) return showError("❌ Please enter a group name.");
    if (state.participants.length === 0) return showError("❌ Please add participants first before saving a group.");

    state.groups[gName] = JSON.parse(JSON.stringify(state.participants));
    groupNameInput.value = '';
    saveState();
    renderGroupDropdown();
    alert(`✅ Group "${gName}" saved successfully!`);
  });

  loadGroupBtn.addEventListener('click', () => {
    clearError();
    const selected = groupSelect.value;
    if (!selected || !state.groups[selected]) return showError("❌ Please select a valid group to load.");

    state.groups[selected].forEach(p => {
      const pObj = typeof p === 'string' ? { name: p, avatar: getRandomHumanAvatar(p) } : p;
      if (!state.participants.some(existing => existing.name.toLowerCase() === pObj.name.toLowerCase())) {
        state.participants.push({ ...pObj });
      }
    });

    saveState();
    renderAll();
  });

  deleteGroupBtn.addEventListener('click', () => {
    clearError();
    const selected = groupSelect.value;
    if (!selected || !state.groups[selected]) return showError("❌ Please select a group to delete.");

    delete state.groups[selected];
    saveState();
    renderGroupDropdown();
  });

  function getActiveBillTotal() {
    const base = state.billDetails.base || 0;
    const taxAmt = base * ((state.billDetails.taxPct || 0) / 100);
    const serviceAmt = base * ((state.billDetails.servicePct || 0) / 100);
    const discountAmt = base * ((state.billDetails.discountPct || 0) / 100);

    let total = base + taxAmt + serviceAmt - discountAmt;

    if (state.tipMode === 'equal') {
      total += (state.billDetails.tip || 0);
    } else if (state.tipMode === 'individual') {
      const indTipsSum = Object.values(state.individualTips).reduce((a, b) => a + (b || 0), 0);
      total += indTipsSum;
    }

    if (state.autoRounding) {
      total = Math.round(total);
    }

    return Math.max(0, total);
  }

  function getScenarioGrandTotal() {
    const activeTotal = getActiveBillTotal();
    const stackedTotal = state.stackedBills.reduce((acc, b) => acc + (b.total || 0), 0);
    return activeTotal + stackedTotal;
  }

  function updateBillSummary() {
    const base = state.billDetails.base || 0;
    const taxAmt = base * ((state.billDetails.taxPct || 0) / 100);
    const serviceAmt = base * ((state.billDetails.servicePct || 0) / 100);
    const discountAmt = base * ((state.billDetails.discountPct || 0) / 100);

    bsBase.textContent = base.toFixed(2);
    bsTax.textContent = taxAmt.toFixed(2);
    bsTaxPct.textContent = state.billDetails.taxPct || 0;
    bsService.textContent = serviceAmt.toFixed(2);
    bsServicePct.textContent = state.billDetails.servicePct || 0;
    bsDiscount.textContent = discountAmt.toFixed(2);
    bsDiscountPct.textContent = state.billDetails.discountPct || 0;

    let tipVal = state.billDetails.tip || 0;
    if (state.tipMode === 'individual') {
      tipVal = Object.values(state.individualTips).reduce((a, b) => a + (b || 0), 0);
    }
    bsTip.textContent = tipVal.toFixed(2);

    const activeTotal = getActiveBillTotal();
    const scenarioTotal = getScenarioGrandTotal();

    grandTotalVal.textContent = activeTotal.toFixed(2);
    if (topGrandTotal) topGrandTotal.textContent = scenarioTotal.toFixed(2);
  }

  function renderValidationBox() {
    const totalBill = getScenarioGrandTotal();
    let totalAssigned = 0;

    if (state.splitMethod === 'exact' || state.splitMethod === 'percentage') {
      if (state.splitMethod === 'percentage') {
        const pctSum = Object.values(state.customShares).reduce((a, b) => a + (b || 0), 0);
        totalAssigned = (totalBill * pctSum) / 100;
      } else {
        totalAssigned = Object.values(state.customShares).reduce((a, b) => a + (b || 0), 0);
      }
    } else {
      totalAssigned = Object.values(state.payments).reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    const diff = totalBill - totalAssigned;

    valTotalBill.textContent = totalBill.toFixed(2);
    valAssigned.textContent = totalAssigned.toFixed(2);
    valDiff.textContent = Math.abs(diff).toFixed(2);

    if (Math.abs(diff) < 0.01) {
      validationBadge.textContent = '✅ Verified (100% Split)';
      validationBadge.className = 'badge badge-settled';
      valDiffContainer.className = 'metric-val text-positive';
    } else {
      validationBadge.textContent = '❌ Discrepancy Found';
      validationBadge.className = 'badge badge-pending';
      valDiffContainer.className = 'metric-val text-negative';
    }
  }

  addBillToScenarioBtn.addEventListener('click', () => {
    clearError();
    const activeTotal = getActiveBillTotal();
    if (activeTotal <= 0) return showError("❌ Active bill total must be greater than 0 to add to stack.");

    const paidBySelect = document.getElementById('stacked-bill-payer-select');
    const paidBy = paidBySelect ? paidBySelect.value : 'Not Specified';

    if (!paidBy || paidBy === 'Not Specified') {
      return showError("❌ Please select who paid the bill before adding it to the stack.");
    }

    const placeName = state.placeVisited || (state.scenario.toUpperCase() + ' Sub-bill ' + (state.stackedBills.length + 1));

    state.stackedBills.push({
      id: Date.now(),
      place: placeName,
      total: activeTotal,
      base: state.billDetails.base,
      paidBy: paidBy,
      items: JSON.parse(JSON.stringify(state.items))
    });

    if (!state.payments[paidBy]) {
      state.payments[paidBy] = { amount: 0, method: 'UPI' };
    }
    state.payments[paidBy].amount = (parseFloat(state.payments[paidBy].amount) || 0) + activeTotal;

    state.billDetails.base = 0;
    state.billDetails.tip = 0;
    state.items = [];
    baseBillInput.value = '';
    tipInput.value = '';
    placeVisitedInput.value = '';
    state.placeVisited = '';
    if (paidBySelect) paidBySelect.value = 'Not Specified';

    saveState();
    renderAll();
    alert(`💸 Bill for "${placeName}" stacked and ${state.currency}${activeTotal.toFixed(2)} automatically added to ${paidBy}'s total payment!`);
  });

  function renderStackedBills() {
    stackedBillsList.innerHTML = '';
    stackedBillsCount.textContent = `${state.stackedBills.length} Bill${state.stackedBills.length !== 1 ? 's' : ''}`;
    if (topBillsCount) {
      topBillsCount.textContent = state.stackedBills.length + (getActiveBillTotal() > 0 ? 1 : 0);
    }

    const payerSelect = document.getElementById('stacked-bill-payer-select');
    if (payerSelect) {
      const currentSelected = payerSelect.value;
      payerSelect.innerHTML = '<option value="Not Specified">-- Select Who Paid This Bill --</option>';
      state.participants.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.avatar} ${p.name}`;
        if (p.name === currentSelected) opt.selected = true;
        payerSelect.appendChild(opt);
      });
    }

    if (state.stackedBills.length === 0) {
      stackedBillsList.innerHTML = `<p style="color: #9ca3af; font-size: 0.88rem;">No additional bills stacked yet in this scenario.</p>`;
      return;
    }

    state.stackedBills.forEach((b, idx) => {
      const li = document.createElement('li');
      li.className = 'item-card';
      li.innerHTML = `
        <div>
          <strong>📍 ${escapeHtml(b.place)}</strong>
          <br><small style="color:#a7f3d0">Total: 💸 ${state.currency}${b.total.toFixed(2)} (${b.items ? b.items.length : 0} items) | 💳 Paid by: <strong>${escapeHtml(b.paidBy)}</strong></small>
        </div>
        <button class="btn-remove btn-remove-stacked" data-stacked-idx="${idx}">&times;</button>
      `;
      stackedBillsList.appendChild(li);
    });

    document.querySelectorAll('.btn-remove-stacked').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.stackedIdx, 10);
        const removedBill = state.stackedBills[idx];
        if (removedBill && removedBill.paidBy && state.payments[removedBill.paidBy]) {
          state.payments[removedBill.paidBy].amount = Math.max(0, (state.payments[removedBill.paidBy].amount || 0) - removedBill.total);
        }
        state.stackedBills.splice(idx, 1);
        saveState();
        renderAll();
      });
    });
  }

  function renderParticipants() {
    participantCount.textContent = `${state.participants.length} Added`;
    participantList.innerHTML = '';

    if (state.participants.length === 0) {
      participantList.innerHTML = `<p style="color: #9ca3af; font-size: 0.88rem;">No participants added yet.</p>`;
      return;
    }

    state.participants.forEach((p, index) => {
      const li = document.createElement('li');
      li.className = 'participant-item';
      li.innerHTML = `
        <div class="p-info">
          <span class="p-avatar-tag">${p.avatar}</span>
          <span class="p-name-text" id="p-name-${index}"><strong>${escapeHtml(p.name)}</strong></span>
        </div>
        <div class="p-actions">
          <button class="btn-icon btn-edit-name" data-index="${index}" title="Edit Name">✏️</button>
          <button class="btn-remove btn-remove-participant" data-index="${index}" title="Remove Participant">&times;</button>
        </div>
      `;
      participantList.appendChild(li);
    });

    document.querySelectorAll('.btn-remove-participant').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const target = state.participants[idx];
        if (target) {
          const name = target.name;
          state.participants.splice(idx, 1);
          delete state.customShares[name];
          delete state.payments[name];
          delete state.individualTips[name];
          delete state.paidStatuses[name];
          delete state.lastMemberMetrics[name];
          saveState();
          renderAll();
        }
      });
    });

    document.querySelectorAll('.btn-edit-name').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const p = state.participants[idx];
        const newName = prompt("Edit participant name:", p.name);
        if (newName && newName.trim() && newName.trim() !== p.name) {
          const oldName = p.name;
          p.name = newName.trim();
          p.avatar = getRandomHumanAvatar(p.name);
          state.customShares[p.name] = state.customShares[oldName];
          state.payments[p.name] = state.payments[oldName];
          state.individualTips[p.name] = state.individualTips[oldName];
          state.paidStatuses[p.name] = state.paidStatuses[oldName];
          state.lastMemberMetrics[p.name] = state.lastMemberMetrics[oldName];

          delete state.customShares[oldName];
          delete state.payments[oldName];
          delete state.individualTips[oldName];
          delete state.paidStatuses[oldName];
          delete state.lastMemberMetrics[oldName];

          saveState();
          renderAll();
        }
      });
    });
  }

  function renderGroupBalanceView() {
    groupBalanceList.innerHTML = '';
    if (state.participants.length === 0) {
      groupBalanceList.innerHTML = `<p style="color: #9ca3af; font-size: 0.88rem;">Add participants to view group balance matrix.</p>`;
      gbTotalSpent.textContent = "0.00";
      gbTotalCollected.textContent = "0.00";
      gbNetDebt.textContent = "0.00";
      return;
    }

    const totalSpent = getScenarioGrandTotal();
    let totalCollected = 0;

    state.participants.forEach(p => {
      totalCollected += (state.payments[p.name]?.amount || 0);
    });

    const netDebt = totalSpent - totalCollected;

    gbTotalSpent.textContent = totalSpent.toFixed(2);
    gbTotalCollected.textContent = totalCollected.toFixed(2);
    gbNetDebt.textContent = Math.abs(netDebt).toFixed(2);

    state.participants.forEach(p => {
      const metric = state.lastMemberMetrics[p.name] || { calculatedShare: 0, expended: 0 };
      const paidAmt = state.payments[p.name]?.amount || 0;
      const share = metric.calculatedShare;
      const bal = paidAmt - share;

      const card = document.createElement('div');
      card.className = 'dynamic-row';
      card.innerHTML = `
        <span>${p.avatar} <strong>${escapeHtml(p.name)}</strong></span>
        <span>
          Paid: 💸 ${state.currency}${paidAmt.toFixed(2)} | Share: ${state.currency}${share.toFixed(2)} | 
          <strong class="${bal >= 0 ? 'text-positive' : 'text-negative'}">
            ${bal >= 0 ? '✅ +' : '❌ '}${state.currency}${bal.toFixed(2)}
          </strong>
        </span>
      `;
      groupBalanceList.appendChild(card);
    });
  }

  function renderWhoConsumedWhat() {
    whoConsumedWhatContainer.innerHTML = '';
    if (state.participants.length === 0) {
      whoConsumedWhatContainer.innerHTML = `<p style="color: #9ca3af; font-size: 0.88rem;">Add participants to view consumption details.</p>`;
      return;
    }

    state.participants.forEach(p => {
      const card = document.createElement('div');
      card.className = 'consumed-person-card';

      let itemsConsumed = [];
      
      state.items.forEach(item => {
        if (item.portions && item.portions[p.name] > 0) {
          itemsConsumed.push(`${item.name} (${item.portions[p.name]} unit${item.portions[p.name] > 1 ? 's' : ''})`);
        }
      });

      state.stackedBills.forEach(sb => {
        if (sb.items) {
          sb.items.forEach(item => {
            if (item.portions && item.portions[p.name] > 0) {
              itemsConsumed.push(`${item.name} [${sb.place}] (${item.portions[p.name]} unit${item.portions[p.name] > 1 ? 's' : ''})`);
            }
          });
        }
      });

      const tagsHtml = itemsConsumed.length > 0
        ? itemsConsumed.map(ic => `<span class="c-tag">✅ ${escapeHtml(ic)}</span>`).join('')
        : `<span style="font-size:0.8rem; color:#9ca3af;">No specific items assigned</span>`;

      card.innerHTML = `
        <div class="c-person-header">${p.avatar} ${escapeHtml(p.name)}</div>
        <div>${tagsHtml}</div>
      `;
      whoConsumedWhatContainer.appendChild(card);
    });
  }

  function renderPaymentTracker() {
    individualPaymentTracker.innerHTML = '';
    if (state.participants.length === 0) {
      individualPaymentTracker.innerHTML = `<p style="color: #9ca3af; font-size: 0.88rem;">Add participants to track payments.</p>`;
      if (topPaidProgress) topPaidProgress.textContent = "0/0 Paid";
      if (topSettlementStatus) {
        topSettlementStatus.textContent = "Pending ❌";
        topSettlementStatus.className = "badge badge-pending";
      }
      settlementStatusBadge.textContent = "⏳ Pending ❌";
      settlementStatusBadge.className = "badge badge-pending";
      return;
    }

    const hasCalculated = state.lastMemberMetrics && Object.keys(state.lastMemberMetrics).length > 0;

    let paidCount = 0;
    state.participants.forEach(p => {
      const row = document.createElement('div');
      row.className = 'payment-tracker-row';

      if (!hasCalculated) {
        row.innerHTML = `
          <span>${p.avatar} ${escapeHtml(p.name)}</span>
          <span class="badge badge-pending" style="font-size:0.8rem;">⏳ Yet to calculate</span>
        `;
      } else {
        const metric = state.lastMemberMetrics[p.name];
        const netBal = metric ? (metric.calculatedShare - metric.expended) : 0;
        const owesMoney = netBal > 0.001;
        const isReceiver = netBal < -0.001;
        const isPaid = state.paidStatuses[p.name] || false;

        if (isPaid || !owesMoney) paidCount++;

        if (owesMoney) {
          row.innerHTML = `
            <span>${p.avatar} ${escapeHtml(p.name)} <small style="color:#fca5a5;">(Owes 💸 ${state.currency}${netBal.toFixed(2)})</small></span>
            <button class="btn ${isPaid ? 'btn-success' : 'btn-secondary'} btn-toggle-paid" data-name="${escapeHtml(p.name)}">
              ${isPaid ? '✅ Paid' : '❌ Pending'}
            </button>
          `;
        } else if (isReceiver) {
          row.innerHTML = `
            <span>${p.avatar} ${escapeHtml(p.name)}</span>
            <span class="badge badge-settled" style="font-size:0.8rem;">📥 Receiver (Clear ✅)</span>
          `;
        } else {
          row.innerHTML = `
            <span>${p.avatar} ${escapeHtml(p.name)}</span>
            <span class="badge badge-settled" style="font-size:0.8rem;">✨ Already Settled ✅</span>
          `;
        }
      }

      individualPaymentTracker.appendChild(row);
    });

    if (topPaidProgress) topPaidProgress.textContent = `${paidCount}/${state.participants.length} Settled`;
    
    if (state.currentStatus === 'Settled' || (paidCount === state.participants.length && state.participants.length > 0 && hasCalculated)) {
      if (topSettlementStatus) {
        topSettlementStatus.textContent = 'Settled ✅';
        topSettlementStatus.className = 'badge badge-settled';
      }
      settlementStatusBadge.textContent = '✅ Settled';
      settlementStatusBadge.className = 'badge badge-settled';
    } else {
      if (topSettlementStatus) {
        topSettlementStatus.textContent = 'Pending ❌';
        topSettlementStatus.className = 'badge badge-pending';
      }
      settlementStatusBadge.textContent = '⏳ Pending ❌';
      settlementStatusBadge.className = 'badge badge-pending';
    }

    document.querySelectorAll('.btn-toggle-paid').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.target.dataset.name;
        state.paidStatuses[name] = !state.paidStatuses[name];
        saveState();
        renderPaymentTracker();
        renderDashboards();
        checkGlobalSettledStatus();
      });
    });
  }

  toggleSettledBtn.addEventListener('click', () => {
    if (state.participants.length === 0) return showError("❌ Please add participants first.");
    
    const targetStatus = state.currentStatus !== 'Settled';
    state.currentStatus = targetStatus ? 'Settled' : 'Pending';

    state.participants.forEach(p => {
      state.paidStatuses[p.name] = targetStatus;
    });

    saveState();
    renderPaymentTracker();
    renderDashboards();

    if (targetStatus) {
      settledCelebrationScreen.classList.remove('hidden');
    }
  });

  function checkGlobalSettledStatus() {
    const allPaid = state.participants.length > 0 && state.participants.every(p => {
      const metric = state.lastMemberMetrics[p.name];
      const owesMoney = !metric || (metric.calculatedShare - metric.expended > 0);
      return !owesMoney || state.paidStatuses[p.name] === true;
    });

    if (allPaid) {
      state.currentStatus = 'Settled';
      settledCelebrationScreen.classList.remove('hidden');
    } else {
      state.currentStatus = 'Pending';
    }
    saveState();
  }

  dismissCelebrationBtn.addEventListener('click', () => {
    settledCelebrationScreen.classList.add('hidden');
  });

  syncBaseFromItemsBtn.addEventListener('click', () => {
    const itemsTotalCost = state.items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    state.billDetails.base = itemsTotalCost;
    baseBillInput.value = itemsTotalCost > 0 ? itemsTotalCost.toFixed(2) : '';
    updateBillSummary();
    renderValidationBox();
    recalculateSharesInternal();
    saveState();
    alert(`⚡ Base bill amount synced to total item cost: 💸 ${state.currency}${itemsTotalCost.toFixed(2)}`);
  });

  function recalculateTotalUnitsFromPortions() {
    let sumUnits = 0;
    document.querySelectorAll('.portion-count-input').forEach(input => {
      const count = parseInt(input.value, 10) || 0;
      sumUnits += count;
    });
    if (itemQtyInput) {
      itemQtyInput.value = sumUnits;
    }
  }

  function renderAll() {
    renderScannedBillPreview();
    renderParticipants();
    renderGroupDropdown();
    renderStackedBills();
    updateBillSummary();
    renderValidationBox();
    handleSplitMethodDisplay();

    individualTipsList.innerHTML = '';
    state.participants.forEach(p => {
      const val = state.individualTips[p.name] !== undefined ? state.individualTips[p.name] : '';
      individualTipsList.insertAdjacentHTML('beforeend', `
        <div class="dynamic-row">
          <label>${p.avatar} ${escapeHtml(p.name)}</label>
          <div class="input-wrapper">
            <span class="currency-symbol dyn-curr">${state.currency}</span>
            <input type="number" step="any" min="0" value="${val}" class="input-field ind-tip-input" data-name="${escapeHtml(p.name)}" placeholder="0.00" />
          </div>
        </div>
      `);
    });

    document.querySelectorAll('.ind-tip-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) delete state.individualTips[e.target.dataset.name];
        else state.individualTips[e.target.dataset.name] = val;
        updateBillSummary();
        renderValidationBox();
        recalculateSharesInternal();
        saveState();
      });
    });

    customSharesList.innerHTML = '';
    paymentsList.innerHTML = '';
    const customSymbol = state.splitMethod === 'percentage' ? '%' : state.currency;

    state.participants.forEach(p => {
      const cVal = state.customShares[p.name] !== undefined ? state.customShares[p.name] : '';
      const pObj = state.payments[p.name] || { amount: '', method: 'UPI' };

      customSharesList.insertAdjacentHTML('beforeend', `
        <div class="dynamic-row">
          <label>${p.avatar} ${escapeHtml(p.name)}</label>
          <div class="input-wrapper">
            <span class="currency-symbol dyn-curr">${customSymbol}</span>
            <input type="number" step="any" min="0" value="${cVal}" class="input-field custom-input" data-name="${escapeHtml(p.name)}" placeholder="0.00" />
          </div>
        </div>
      `);

      paymentsList.insertAdjacentHTML('beforeend', `
        <div class="payment-row">
          <label>${p.avatar} ${escapeHtml(p.name)}</label>
          <div class="input-wrapper">
            <span class="currency-symbol dyn-curr">${state.currency}</span>
            <input type="number" step="any" min="0" value="${pObj.amount}" class="input-field payment-amount-input" data-name="${escapeHtml(p.name)}" placeholder="Paid 0.00" />
          </div>
          <select class="select-field payment-method-select" data-name="${escapeHtml(p.name)}">
            <option value="UPI" ${pObj.method === 'UPI' ? 'selected' : ''}>📱 UPI</option>
            <option value="Cash" ${pObj.method === 'Cash' ? 'selected' : ''}>💵 Cash</option>
            <option value="Credit Card" ${pObj.method === 'Credit Card' ? 'selected' : ''}>💳 Credit</option>
          </select>
        </div>
      `);
    });

    document.querySelectorAll('.custom-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val) || val < 0) delete state.customShares[e.target.dataset.name];
        else state.customShares[e.target.dataset.name] = val;
        renderValidationBox();
        recalculateSharesInternal();
        saveState();
      });
    });

    document.querySelectorAll('.payment-amount-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const name = e.target.dataset.name;
        const val = parseFloat(e.target.value);
        if (!state.payments[name]) state.payments[name] = { amount: 0, method: 'UPI' };
        state.payments[name].amount = isNaN(val) || val < 0 ? 0 : val;
        renderValidationBox();
        renderGroupBalanceView();
        recalculateSharesInternal();
        saveState();
      });
    });

    document.querySelectorAll('.payment-method-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const name = e.target.dataset.name;
        if (!state.payments[name]) state.payments[name] = { amount: 0, method: 'UPI' };
        state.payments[name].method = e.target.value;
        saveState();
      });
    });

    itemPortionInputs.innerHTML = '';
    if (state.participants.length === 0) {
      itemPortionInputs.innerHTML = `<span style="color:#9ca3af; font-size:0.8rem;">Add participants first to assign portions.</span>`;
    } else {
      state.participants.forEach(p => {
        itemPortionInputs.insertAdjacentHTML('beforeend', `
          <div class="portion-item">
            <span>${p.avatar} ${escapeHtml(p.name)}</span>
            <div class="portion-counter">
              <label style="font-size:0.75rem; color:#9ca3af;">Units:</label>
              <input type="number" min="0" step="1" value="0" class="input-field portion-count-input" data-name="${escapeHtml(p.name)}" />
            </div>
          </div>
        `);
      });
    }

    document.querySelectorAll('.portion-count-input').forEach(input => {
      input.addEventListener('input', recalculateTotalUnitsFromPortions);
    });
    recalculateTotalUnitsFromPortions();

    renderItemsList();
    renderWhoConsumedWhat();
    renderPaymentTracker();
    renderGroupBalanceView();
    renderDashboards();
    renderHistory();
    document.querySelectorAll('.dyn-curr').forEach(el => el.textContent = state.currency);
  }

  function renderItemsList() {
    itemsList.innerHTML = '';
    state.items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'item-card';
      const portionDetails = Object.entries(item.portions)
        .filter(([_, count]) => count > 0)
        .map(([pName, count]) => `${escapeHtml(pName)} (${count} unit${count > 1 ? 's' : ''})`)
        .join(', ');

      li.innerHTML = `
        <div>
          <strong>${escapeHtml(item.name)}</strong> (x${item.qty}) - 💸 ${state.currency}${(item.price * item.qty).toFixed(2)}
          <br><small style="color:#a7f3d0">Portions: ${portionDetails || 'None'}</small>
        </div>
        <button class="btn-remove btn-remove-item" data-item-idx="${idx}">&times;</button>
      `;
      itemsList.appendChild(li);
    });

    document.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.itemIdx, 10);
        state.items.splice(idx, 1);
        saveState();
        renderItemsList();
        renderWhoConsumedWhat();
        recalculateSharesInternal();
      });
    });
  }

  addItemBtn.addEventListener('click', () => {
    clearError();
    const name = itemNameInput.value.trim();
    const price = parseFloat(itemPriceInput.value);

    if (!name || isNaN(price) || price <= 0) return showError("❌ Enter valid item name and price.");

    const portions = {};
    let totalPortions = 0;
    document.querySelectorAll('.portion-count-input').forEach(input => {
      const count = parseInt(input.value, 10) || 0;
      if (count > 0) {
        portions[input.dataset.name] = count;
        totalPortions += count;
      }
    });

    if (totalPortions === 0) return showError("❌ Assign at least 1 unit to a participant.");

    const qty = totalPortions;
    itemQtyInput.value = totalPortions;

    state.items.push({ id: Date.now(), name, price, qty, portions });
    itemNameInput.value = '';
    itemPriceInput.value = '';
    
    document.querySelectorAll('.portion-count-input').forEach(input => input.value = '0');
    recalculateTotalUnitsFromPortions();

    if (state.splitMethod === 'items') {
      const itemsTotalCost = state.items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
      state.billDetails.base = itemsTotalCost;
      baseBillInput.value = itemsTotalCost > 0 ? itemsTotalCost.toFixed(2) : '';
    }

    saveState();
    renderAll();
    recalculateSharesInternal();
  });

  function addParticipant() {
    clearError();
    const name = participantInput.value.trim();
    const selectedAvatar = avatarPicker.value;

    if (!name) return showError("❌ Please enter a participant name.");
    if (state.participants.some(p => p.name.toLowerCase() === name.toLowerCase())) return showError("❌ Participant already added.");

    const avatar = (selectedAvatar === 'auto' || !selectedAvatar) 
      ? getRandomHumanAvatar(name) 
      : selectedAvatar;

    state.participants.push({ name, avatar });
    participantInput.value = '';
    avatarPicker.value = 'auto';
    saveState();
    renderAll();
  }

  addBtn.addEventListener('click', addParticipant);
  participantInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addParticipant();
  });

  [baseBillInput, taxInput, serviceChargeInput, discountInput, tipInput].forEach(input => {
    input.addEventListener('input', () => {
      state.billDetails.base = parseFloat(baseBillInput.value) || 0;
      state.billDetails.taxPct = parseFloat(taxInput.value) || 0;
      state.billDetails.servicePct = parseFloat(serviceChargeInput.value) || 0;
      state.billDetails.discountPct = parseFloat(discountInput.value) || 0;
      state.billDetails.tip = parseFloat(tipInput.value) || 0;
      updateBillSummary();
      renderValidationBox();
      recalculateSharesInternal();
      saveState();
    });
  });

  function handleSplitMethodDisplay() {
    splitMethodSelect.value = state.splitMethod;
    if (state.splitMethod === 'items') {
      manualBaseContainer.classList.add('hidden');
      itemizedSplitContainer.classList.remove('hidden');
      customSplitContainer.classList.add('hidden');
      const itemsTotalCost = state.items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
      state.billDetails.base = itemsTotalCost;
    } else {
      manualBaseContainer.classList.remove('hidden');
      itemizedSplitContainer.classList.add('hidden');
      if (state.splitMethod === 'exact' || state.splitMethod === 'percentage') {
        customSplitContainer.classList.remove('hidden');
      } else {
        customSplitContainer.classList.add('hidden');
      }
    }
  }

  splitMethodSelect.addEventListener('change', (e) => {
    state.splitMethod = e.target.value;
    handleSplitMethodDisplay();
    updateBillSummary();
    renderValidationBox();
    recalculateSharesInternal();
    saveState();
  });

  function recalculateSharesInternal() {
    if (state.participants.length === 0) return;

    let sharesCents = {};
    let itemBreakdownPerMember = {};
    state.participants.forEach(p => {
      sharesCents[p.name] = 0;
      itemBreakdownPerMember[p.name] = [];
    });

    const scenarioTotal = getScenarioGrandTotal();

    if (state.splitMethod === 'equal') {
      const totalCents = Math.round(scenarioTotal * 100);
      const baseShare = Math.floor(totalCents / state.participants.length);
      let remainder = totalCents % state.participants.length;

      state.participants.forEach(p => {
        sharesCents[p.name] = baseShare + (remainder > 0 ? 1 : 0);
        remainder--;
      });
    } else if (state.splitMethod === 'items') {
      state.items.forEach(item => {
        const itemTotalCost = item.price * item.qty;
        const totalPortions = Object.values(item.portions).reduce((a, b) => a + b, 0);

        if (totalPortions > 0) {
          Object.entries(item.portions).forEach(([pName, count]) => {
            if (sharesCents[pName] !== undefined && count > 0) {
              const portionCost = itemTotalCost * (count / totalPortions);
              sharesCents[pName] += Math.round(portionCost * 100);
              itemBreakdownPerMember[pName].push(`${item.name} (${count} unit${count > 1 ? 's' : ''})`);
            }
          });
        }
      });

      const itemsTotal = state.items.reduce((a, b) => a + (b.price * b.qty), 0);
      if (itemsTotal > 0) {
        const remainingScenarioCost = scenarioTotal - itemsTotal;
        state.participants.forEach(p => {
          const ratio = (sharesCents[p.name] / 100) / itemsTotal;
          sharesCents[p.name] += Math.round(remainingScenarioCost * ratio * 100);
        });
      }
    } else if (state.splitMethod === 'exact') {
      state.participants.forEach(p => sharesCents[p.name] = Math.round((state.customShares[p.name] || 0) * 100));
    } else if (state.splitMethod === 'percentage') {
      const grandTotalCents = Math.round(scenarioTotal * 100);
      state.participants.forEach(p => {
        sharesCents[p.name] = Math.round(grandTotalCents * ((state.customShares[p.name] || 0) / 100));
      });
    }

    if (state.tipMode === 'individual') {
      state.participants.forEach(p => {
        sharesCents[p.name] += Math.round((state.individualTips[p.name] || 0) * 100);
      });
    }

    let balancesCents = {};
    let summaryHtml = `<div style="font-weight:700; margin-bottom:8px; color:#c084fc; font-size:0.95rem;">💸 Summary Breakdown:</div>`;

    state.participants.forEach(p => {
      let paidObj = state.payments[p.name] || { amount: 0, method: 'UPI' };
      let paidCents = Math.round((paidObj.amount || 0) * 100);
      let calcShare = sharesCents[p.name] / 100;

      if (state.autoRounding) {
        calcShare = Math.round(calcShare);
      }

      let netCents = paidCents - Math.round(calcShare * 100);
      balancesCents[p.name] = netCents;

      state.lastMemberMetrics[p.name] = {
        expended: paidObj.amount || 0,
        paymentMethod: paidObj.method || 'UPI',
        calculatedShare: calcShare,
        netBalance: (netCents / 100),
        itemsConsumed: itemBreakdownPerMember[p.name] || []
      };

      summaryHtml += `
        <div class="bs-row">
          <span>${p.avatar} ${escapeHtml(p.name)}</span>
          <span>Share: ${state.currency}${calcShare.toFixed(2)} | Paid: 💸 ${state.currency}${(paidCents / 100).toFixed(2)}</span>
        </div>
      `;
    });

    transactionSummaryBox.innerHTML = summaryHtml;

    let debtors = [], receivers = [];
    state.participants.forEach(p => {
      if (balancesCents[p.name] < 0) debtors.push({ name: p.name, amount: Math.abs(balancesCents[p.name]) });
      else if (balancesCents[p.name] > 0) receivers.push({ name: p.name, amount: balancesCents[p.name] });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    receivers.sort((a, b) => b.amount - a.amount);

    let transactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < receivers.length) {
      let amt = Math.min(debtors[i].amount, receivers[j].amount);
      transactions.push({ from: debtors[i].name, to: receivers[j].name, amount: amt / 100 });
      debtors[i].amount -= amt;
      receivers[j].amount -= amt;
      if (debtors[i].amount === 0) i++;
      if (receivers[j].amount === 0) j++;
    }

    settlementPlanList.innerHTML = '';
    if (transactions.length === 0) {
      settlementPlanList.innerHTML = `<li class="settlement-item">🎉 Everyone paid their exact share! No transactions needed. ✅</li>`;
    } else {
      transactions.forEach(t => {
        settlementPlanList.insertAdjacentHTML('beforeend', `
          <li class="settlement-item">
            💸 <strong>${escapeHtml(t.from)}</strong> owes <strong>${escapeHtml(t.to)}</strong>: <strong>${state.currency}${t.amount.toFixed(2)}</strong>
          </li>
        `);
      });
    }

    state.lastCalculatedTransactions = transactions;
    renderGroupBalanceView();
  }

  calculateBtn.addEventListener('click', () => {
    clearError();
    if (state.participants.length === 0) return showError("❌ Please add participants first.");

    recalculateSharesInternal();
    
    // FIX 2: Reveal the individual payment tracker section ONLY after calculation button is clicked
    individualPaymentTrackerSection.classList.remove('hidden');
    resultsSection.classList.remove('hidden');
    
    renderPaymentTracker();
    renderDashboards();
    saveState();
  });

  function generateUPIQRCode() {
    qrCodeBox.innerHTML = '';
    const vpa = qrVpaInput.value.trim() || 'paytm@upi';
    const name = qrNameInput.value.trim() || 'SettleMate';
    const amount = parseFloat(qrAmountInput.value) || 0;

    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;

    if (typeof QRCode !== 'undefined') {
      new QRCode(qrCodeBox, {
        text: upiUri,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      qrCodeBox.innerHTML = '<p style="color:#ef4444; font-size:0.8rem;">❌ QRCode library loading error.</p>';
    }
  }

  openQrBtn.addEventListener('click', () => {
    const totalToPay = getScenarioGrandTotal();
    qrAmountInput.value = totalToPay.toFixed(2);
    generateUPIQRCode();
    qrModal.classList.remove('hidden');
  });

  closeQrBtn.addEventListener('click', () => {
    qrModal.classList.add('hidden');
  });

  [qrVpaInput, qrNameInput, qrAmountInput].forEach(input => {
    input.addEventListener('input', generateUPIQRCode);
  });

  function buildShareText() {
    let scenarioText = expenseSituationSelect.value === 'custom' 
      ? (state.customScenarioName || 'Bill Settlement') 
      : expenseSituationSelect.options[expenseSituationSelect.selectedIndex].text;

    let text = `🧾 *SettleMate Summary: ${scenarioText}*\n`;
    text += `💸 Total Amount: ${state.currency}${getScenarioGrandTotal().toFixed(2)}\n\n`;

    text += `📊 *Individual Shares:*\n`;
    state.participants.forEach(p => {
      const metric = state.lastMemberMetrics[p.name] || { calculatedShare: 0 };
      text += `• ${p.avatar} ${p.name}: ${state.currency}${metric.calculatedShare.toFixed(2)}\n`;
    });

    text += `\n💸 *Settlement Plan:*\n`;
    if (state.lastCalculatedTransactions.length === 0) {
      text += `🎉 Everyone is fully settled! ✅\n`;
    } else {
      state.lastCalculatedTransactions.forEach(t => {
        text += `• ${t.from} ➔ ${t.to}: ${state.currency}${t.amount.toFixed(2)}\n`;
      });
    }

    return text;
  }

  shareWhatsappBtn.addEventListener('click', () => {
    const text = buildShareText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  });

  shareNativeBtn.addEventListener('click', () => {
    const text = buildShareText();
    if (navigator.share) {
      navigator.share({ title: 'SettleMate Summary', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("✅ Settlement summary copied to clipboard!");
    }
  });

  saveHistoryBtn.addEventListener('click', () => {
    if (state.participants.length === 0 && getScenarioGrandTotal() === 0) {
      return showError("❌ No bill data or participants to save.");
    }

    let scenarioText = 'Custom Bill';
    if (expenseSituationSelect.value === 'custom') {
      scenarioText = state.customScenarioName || 'Custom Scenario';
    } else {
      scenarioText = expenseSituationSelect.options[expenseSituationSelect.selectedIndex].text;
    }

    const now = new Date();
    const formattedDateTime = now.toLocaleDateString() + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let fullTitle = scenarioText;
    if (state.placeVisited) {
      fullTitle += ` - 📍 ${state.placeVisited}`;
    }

    const historyEntryId = state.editingHistoryId || Date.now();

    const historyItem = {
      id: historyEntryId,
      dateTime: formattedDateTime,
      scenario: fullTitle,
      total: getScenarioGrandTotal(),
      currency: state.currency,
      status: state.currentStatus,
      participantsGroup: JSON.parse(JSON.stringify(state.participants)),
      transactions: state.lastCalculatedTransactions || [],
      fullState: {
        currency: state.currency,
        participants: JSON.parse(JSON.stringify(state.participants)),
        customShares: JSON.parse(JSON.stringify(state.customShares)),
        payments: JSON.parse(JSON.stringify(state.payments)),
        paidStatuses: JSON.parse(JSON.stringify(state.paidStatuses)),
        individualTips: JSON.parse(JSON.stringify(state.individualTips)),
        tipMode: state.tipMode,
        autoRounding: state.autoRounding,
        items: JSON.parse(JSON.stringify(state.items)),
        billDetails: JSON.parse(JSON.stringify(state.billDetails)),
        stackedBills: JSON.parse(JSON.stringify(state.stackedBills)),
        splitMethod: state.splitMethod,
        scenario: state.scenario,
        customScenarioName: state.customScenarioName,
        placeVisited: state.placeVisited,
        scannedBillImageData: state.scannedBillImageData,
        lastMemberMetrics: JSON.parse(JSON.stringify(state.lastMemberMetrics))
      }
    };

    if (state.editingHistoryId) {
      const existingIdx = state.history.findIndex(h => h.id === state.editingHistoryId);
      if (existingIdx !== -1) {
        state.history[existingIdx] = historyItem;
      } else {
        state.history.unshift(historyItem);
      }
      state.editingHistoryId = null;
    } else {
      state.history.unshift(historyItem);
    }

    state.participants = [];
    state.customShares = {};
    state.payments = {};
    state.individualTips = {};
    state.items = [];
    state.stackedBills = [];
    state.lastMemberMetrics = {};
    state.paidStatuses = {};
    state.billDetails = { base: 0, taxPct: 5, servicePct: 10, discountPct: 0, tip: 0 };
    state.currentStatus = 'Pending';
    state.lastCalculatedTransactions = [];
    state.customScenarioName = '';
    state.placeVisited = '';
    state.scannedBillImageData = null;
    state.isStackingEnabled = false;

    baseBillInput.value = '';
    taxInput.value = '5';
    serviceChargeInput.value = '10';
    discountInput.value = '0';
    tipInput.value = '';
    customScenarioInput.value = '';
    placeVisitedInput.value = '';
    if (enableStackToggle) enableStackToggle.checked = false;
    if (stackPayerContainer) stackPayerContainer.classList.add('hidden');
    if (billScanInput) billScanInput.value = '';
    
    resultsSection.classList.add('hidden');
    individualPaymentTrackerSection.classList.add('hidden');

    showWizardStep(1);
    saveState();
    renderAll();
    alert("✅ Bill successfully saved to history and reset!");
  });

  function renderHistory() {
    historyList.innerHTML = '';
    if (state.history.length === 0) {
      historyList.innerHTML = '<p style="color: #9ca3af; font-size: 0.88rem;">No past settlement history saved yet.</p>';
      return;
    }

    state.history.forEach((h, idx) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      const statusClass = h.status === 'Settled' ? 'badge-settled' : 'badge-pending';
      const txRows = (h.transactions || []).map(t => 
        `<div style="font-size:0.85rem; color:#a7f3d0;">💸 ${escapeHtml(t.from)} ➔ ${escapeHtml(t.to)}: ${h.currency}${t.amount.toFixed(2)}</div>`
      ).join('');

      const memberNames = (h.participantsGroup || []).map(p => `${p.avatar || getRandomHumanAvatar(p.name || p)} ${p.name || p}`).join(', ');

      card.innerHTML = `
        <div class="history-header">
          <strong>${escapeHtml(h.scenario)}</strong>
          <span class="badge ${statusClass}">${h.status === 'Settled' ? '✅ ' : '❌ '}${h.status}</span>
        </div>
        <div class="history-date">📅 ${h.dateTime} - Total: 💸 ${h.currency}${h.total.toFixed(2)}</div>
        <div style="font-size:0.8rem; color:#9ca3af; margin-top:4px;">👥 Members: ${escapeHtml(memberNames || 'None')}</div>
        <div style="margin-top:6px;">${txRows || '<span style="font-size:0.85rem; color:#34d399;">Fully Settled ✅</span>'}</div>
        <button type="button" class="btn btn-purple btn-reload-hist-group" data-hist-idx="${idx}" style="margin-top:8px; font-size:0.78rem; padding:4px 10px;">
          🔄 Re-load This Group
        </button>
      `;
      historyList.appendChild(card);
    });

    document.querySelectorAll('.btn-reload-hist-group').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.histIdx, 10);
        const histItem = state.history[idx];
        if (histItem) {
          state.editingHistoryId = histItem.id;

          if (histItem.fullState) {
            state.currency = histItem.fullState.currency || '₹';
            state.participants = JSON.parse(JSON.stringify(histItem.fullState.participants || []));
            state.customShares = JSON.parse(JSON.stringify(histItem.fullState.customShares || {}));
            state.payments = JSON.parse(JSON.stringify(histItem.fullState.payments || {}));
            state.paidStatuses = JSON.parse(JSON.stringify(histItem.fullState.paidStatuses || {}));
            state.individualTips = JSON.parse(JSON.stringify(histItem.fullState.individualTips || {}));
            state.tipMode = histItem.fullState.tipMode || 'equal';
            state.autoRounding = !!histItem.fullState.autoRounding;
            state.items = JSON.parse(JSON.stringify(histItem.fullState.items || []));
            state.billDetails = JSON.parse(JSON.stringify(histItem.fullState.billDetails || { base: 0, taxPct: 5, servicePct: 10, discountPct: 0, tip: 0 }));
            state.stackedBills = JSON.parse(JSON.stringify(histItem.fullState.stackedBills || []));
            state.splitMethod = histItem.fullState.splitMethod || 'equal';
            state.scenario = histItem.fullState.scenario || 'restaurant';
            state.customScenarioName = histItem.fullState.customScenarioName || '';
            state.placeVisited = histItem.fullState.placeVisited || '';
            state.scannedBillImageData = histItem.fullState.scannedBillImageData || null;
            state.currentStatus = histItem.status || 'Pending';
            state.lastCalculatedTransactions = JSON.parse(JSON.stringify(histItem.transactions || []));
            state.lastMemberMetrics = JSON.parse(JSON.stringify(histItem.fullState.lastMemberMetrics || {}));

            currencySelect.value = state.currency;
            baseBillInput.value = state.billDetails.base > 0 ? state.billDetails.base : '';
            taxInput.value = state.billDetails.taxPct;
            serviceChargeInput.value = state.billDetails.servicePct;
            discountInput.value = state.billDetails.discountPct;
            tipInput.value = state.billDetails.tip > 0 ? state.billDetails.tip : '';
            tipModeSelect.value = state.tipMode;
            roundingToggle.checked = state.autoRounding;
            expenseSituationSelect.value = state.scenario;
            if (state.scenario === 'custom') {
              customScenarioInput.classList.remove('hidden');
              customScenarioInput.value = state.customScenarioName;
            } else {
              customScenarioInput.classList.add('hidden');
            }
            placeVisitedInput.value = state.placeVisited;
            splitMethodSelect.value = state.splitMethod;

            if (state.tipMode === 'individual') {
              individualTipsContainer.classList.remove('hidden');
            } else {
              individualTipsContainer.classList.add('hidden');
            }
          }

          saveState();
          renderAll();

          recalculateSharesInternal();
          resultsSection.classList.remove('hidden');
          individualPaymentTrackerSection.classList.remove('hidden');
          renderPaymentTracker();
          renderDashboards();
          showWizardStep(4);

          alert("✅ Bill successfully re-loaded with previous settlement status retained!");
        }
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all history?")) {
      state.history = [];
      saveState();
      renderHistory();
    }
  });

  function getPastUnsettledDebt(participantName) {
    let pastDebt = 0;
    state.history.forEach(h => {
      if (h.status !== 'Settled' && h.transactions) {
        h.transactions.forEach(t => {
          if (t.from.toLowerCase() === participantName.toLowerCase()) {
            pastDebt += (t.amount || 0);
          }
        });
      }
    });
    return pastDebt;
  }

  function renderDashboards() {
    dashboardsGrid.innerHTML = '';
    if (state.participants.length === 0) {
      dashboardsGrid.innerHTML = `<p style="color: #9ca3af; font-size: 0.88rem;">Add participants and calculate settlement to generate individual dashboards.</p>`;
      return;
    }

    state.participants.forEach(p => {
      const metric = state.lastMemberMetrics[p.name] || {
        expended: (state.payments[p.name]?.amount || 0),
        paymentMethod: (state.payments[p.name]?.method || 'UPI'),
        calculatedShare: 0,
        netBalance: 0,
        itemsConsumed: []
      };

      const isPaid = state.paidStatuses[p.name] || false;
      const netPending = metric.calculatedShare - metric.expended;
      const pastUnsettledDebt = getPastUnsettledDebt(p.name);
      const totalAccumulatedDebt = Math.max(0, netPending) + pastUnsettledDebt;

      const card = document.createElement('div');
      card.className = 'member-dashboard-card';
      card.innerHTML = `
        <div class="dashboard-header">
          <span style="font-weight:700; font-size:1.05rem;">${p.avatar} ${escapeHtml(p.name)}</span>
          <span class="badge ${isPaid || netPending <= 0 ? 'badge-settled' : 'badge-pending'}">
            ${netPending <= 0 ? '📥 Clear ✅' : (isPaid ? '✅ Paid' : '❌ Pending')}
          </span>
        </div>

        <div class="metrics-grid">
          <div class="metric-box">
            <span class="metric-label">Current Share</span>
            <span class="metric-val text-purple">💸 ${state.currency}${metric.calculatedShare.toFixed(2)}</span>
          </div>

          <div class="metric-box">
            <span class="metric-label">Total Paid</span>
            <span class="metric-val text-positive">💸 ${state.currency}${metric.expended.toFixed(2)}</span>
          </div>

          <div class="metric-box">
            <span class="metric-label">Current Pending</span>
            <span class="metric-val ${netPending <= 0 ? 'text-positive' : 'text-negative'}">
              💸 ${state.currency}${Math.abs(netPending).toFixed(2)} ${netPending > 0 ? 'Owes ❌' : 'Clear ✅'}
            </span>
          </div>

          <div class="metric-box">
            <span class="metric-label">Previous Debt (Unsettled)</span>
            <span class="metric-val ${pastUnsettledDebt > 0 ? 'text-negative' : 'text-positive'}">
              💸 ${state.currency}${pastUnsettledDebt.toFixed(2)}
            </span>
          </div>
        </div>

        <div class="total-debt-banner ${totalAccumulatedDebt > 0 ? 'debt-active' : 'debt-clear'}">
          <span>Total Outstanding Balance:</span>
          <strong>💸 ${state.currency}${totalAccumulatedDebt.toFixed(2)}</strong>
        </div>
      `;
      dashboardsGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  showWizardStep(state.currentWizardStep || 1);
  renderAll();
});