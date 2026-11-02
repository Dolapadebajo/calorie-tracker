/**
 * CaloTrack — Vanilla JavaScript Engine
 * Fully client-side with persistent localStorage
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY_ENTRIES = 'calorietrack_entries';
  const STORAGE_KEY_GOAL = 'calorietrack_goal';

  // --- State ---
  let currentDate = getTodayDateString();
  let dailyGoal = 2000;
  let entries = [];

  // --- Common Presets ---
  const FOOD_PRESETS = [
    { name: 'Boiled Egg (Large)', calories: 78, protein: 6, carbs: 0.6, fat: 5, category: 'Breakfast' },
    { name: 'Oatmeal (1 cup)', calories: 150, protein: 5, carbs: 27, fat: 2.5, category: 'Breakfast' },
    { name: 'Banana (Medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, category: 'Snacks' },
    { name: 'Chicken Breast (150g)', calories: 247, protein: 46, carbs: 0, fat: 5, category: 'Lunch' },
    { name: 'White Rice (1 cup)', calories: 205, protein: 4.2, carbs: 45, fat: 0.4, category: 'Lunch' },
    { name: 'Greek Yogurt (170g)', calories: 130, protein: 17, carbs: 6, fat: 4, category: 'Snacks' },
    { name: 'Avocado (Half)', calories: 160, protein: 2, carbs: 9, fat: 15, category: 'Lunch' },
    { name: 'Grilled Salmon (150g)', calories: 310, protein: 34, carbs: 0, fat: 18, category: 'Dinner' },
    { name: 'Protein Shake', calories: 140, protein: 25, carbs: 3, fat: 2, category: 'Snacks' },
    { name: 'Black Coffee', calories: 2, protein: 0.3, carbs: 0, fat: 0, category: 'Breakfast' },
    { name: 'Mixed Green Salad', calories: 60, protein: 2, carbs: 8, fat: 2, category: 'Dinner' },
    { name: 'Peanut Butter (2 tbsp)', calories: 190, protein: 8, carbs: 7, fat: 16, category: 'Snacks' }
  ];

  // --- DOM Elements ---
  const datePicker = document.getElementById('datePicker');
  const dateLabel = document.getElementById('dateLabel');
  const prevDateBtn = document.getElementById('prevDateBtn');
  const nextDateBtn = document.getElementById('nextDateBtn');
  const todayBtn = document.getElementById('todayBtn');

  const consumedCaloriesEl = document.getElementById('consumedCalories');
  const goalCaloriesEl = document.getElementById('goalCalories');
  const remainingCaloriesEl = document.getElementById('remainingCalories');
  const remainingLabelEl = document.getElementById('remainingLabel');
  const budgetStatusPill = document.getElementById('budgetStatusPill');

  const calorieProgressBar = document.getElementById('calorieProgressBar');
  const progressPercentageEl = document.getElementById('progressPercentage');
  const caloriePaceTextEl = document.getElementById('caloriePaceText');

  const proteinAmountEl = document.getElementById('proteinAmount');
  const proteinCaloriesEl = document.getElementById('proteinCalories');
  const carbsAmountEl = document.getElementById('carbsAmount');
  const carbsCaloriesEl = document.getElementById('carbsCalories');
  const fatAmountEl = document.getElementById('fatAmount');
  const fatCaloriesEl = document.getElementById('fatCalories');

  const mealLists = {
    Breakfast: document.getElementById('breakfastList'),
    Lunch: document.getElementById('lunchList'),
    Dinner: document.getElementById('dinnerList'),
    Snacks: document.getElementById('snacksList')
  };

  const mealTotals = {
    Breakfast: document.getElementById('breakfastTotal'),
    Lunch: document.getElementById('lunchTotal'),
    Dinner: document.getElementById('dinnerTotal'),
    Snacks: document.getElementById('snacksTotal')
  };

  const addFoodForm = document.getElementById('addFoodForm');
  const foodNameInput = document.getElementById('foodName');
  const mealTypeSelect = document.getElementById('mealType');
  const caloriesInput = document.getElementById('calories');
  const proteinInput = document.getElementById('protein');
  const carbsInput = document.getElementById('carbs');
  const fatInput = document.getElementById('fat');

  const presetsContainer = document.getElementById('presetsContainer');

  const setGoalBtn = document.getElementById('setGoalBtn');
  const goalModal = document.getElementById('goalModal');
  const closeGoalModal = document.getElementById('closeGoalModal');
  const cancelGoalBtn = document.getElementById('cancelGoalBtn');
  const goalForm = document.getElementById('goalForm');
  const dailyGoalInput = document.getElementById('dailyGoalInput');

  const clearDayBtn = document.getElementById('clearDayBtn');
  const resetAllBtn = document.getElementById('resetAllBtn');
  const toastContainer = document.getElementById('toastContainer');

  // --- Initialization ---
  function init() {
    loadGoal();
    loadEntries();
    setupEventListeners();
    renderPresets();
    syncDate(currentDate);
  }

  // --- Storage Functions ---
  function loadGoal() {
    const saved = localStorage.getItem(STORAGE_KEY_GOAL);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        dailyGoal = parsed;
      }
    }
    goalCaloriesEl.textContent = dailyGoal.toLocaleString();
    dailyGoalInput.value = dailyGoal;
  }

  function saveGoal(newGoal) {
    dailyGoal = newGoal;
    localStorage.setItem(STORAGE_KEY_GOAL, dailyGoal.toString());
    goalCaloriesEl.textContent = dailyGoal.toLocaleString();
    renderCurrentDay();
  }

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
      entries = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(entries)) entries = [];
    } catch (e) {
      console.error('Failed to parse entries from localStorage', e);
      entries = [];
    }
  }

  function persistEntries() {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries to localStorage', e);
      showToast('Error saving data to browser storage', 'danger');
    }
  }

  // --- Date Helpers ---
  function getTodayDateString() {
    const now = new Date();
    return formatDateToString(now);
  }

  function formatDateToString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatHumanDate(dateStr) {
    const today = getTodayDateString();
    if (dateStr === today) return 'Today';

    const d = new Date(dateStr + 'T00:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === formatDateToString(yesterday)) return 'Yesterday';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === formatDateToString(tomorrow)) return 'Tomorrow';

    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  function syncDate(newDateStr) {
    currentDate = newDateStr;
    datePicker.value = currentDate;
    dateLabel.textContent = formatHumanDate(currentDate);
    renderCurrentDay();
  }

  function shiftDate(days) {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    syncDate(formatDateToString(d));
  }

  // --- Rendering ---
  function renderCurrentDay() {
    const dayEntries = entries.filter(item => item.date === currentDate);

    // Grouping
    const grouped = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: []
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    dayEntries.forEach(entry => {
      if (grouped[entry.category]) {
        grouped[entry.category].push(entry);
      } else {
        grouped.Snacks.push(entry);
      }
      totalCalories += entry.calories || 0;
      totalProtein += entry.protein || 0;
      totalCarbs += entry.carbs || 0;
      totalFat += entry.fat || 0;
    });

    // Update Energy Metrics
    consumedCaloriesEl.textContent = totalCalories.toLocaleString();
    const remaining = dailyGoal - totalCalories;

    if (remaining < 0) {
      remainingLabelEl.textContent = 'Exceeded By';
      remainingCaloriesEl.textContent = Math.abs(remaining).toLocaleString();
      remainingCaloriesEl.classList.add('over-budget');
      budgetStatusPill.textContent = 'Over Limit';
      budgetStatusPill.className = 'status-pill over-limit';
      calorieProgressBar.className = 'progress-bar-fill exceeded';
      calorieProgressBar.style.width = '100%';
      caloriePaceTextEl.textContent = `${Math.abs(remaining).toLocaleString()} kcal over budget`;
    } else {
      remainingLabelEl.textContent = 'Remaining';
      remainingCaloriesEl.textContent = remaining.toLocaleString();
      remainingCaloriesEl.classList.remove('over-budget');

      const pct = dailyGoal > 0 ? (totalCalories / dailyGoal) * 100 : 0;
      calorieProgressBar.style.width = `${Math.min(pct, 100)}%`;

      if (pct >= 90) {
        budgetStatusPill.textContent = 'Near Target';
        budgetStatusPill.className = 'status-pill near-goal';
        calorieProgressBar.className = 'progress-bar-fill warning';
      } else {
        budgetStatusPill.textContent = 'On Track';
        budgetStatusPill.className = 'status-pill on-track';
        calorieProgressBar.className = 'progress-bar-fill';
      }
      caloriePaceTextEl.textContent = `${remaining.toLocaleString()} kcal left`;
    }

    const percentage = dailyGoal > 0 ? Math.round((totalCalories / dailyGoal) * 100) : 0;
    progressPercentageEl.textContent = `${percentage}% of target`;

    // Update Macros
    proteinAmountEl.textContent = Math.round(totalProtein * 10) / 10;
    proteinCaloriesEl.textContent = Math.round(totalProtein * 4);

    carbsAmountEl.textContent = Math.round(totalCarbs * 10) / 10;
    carbsCaloriesEl.textContent = Math.round(totalCarbs * 4);

    fatAmountEl.textContent = Math.round(totalFat * 10) / 10;
    fatCaloriesEl.textContent = Math.round(totalFat * 9);

    // Update Meal Sections
    Object.keys(grouped).forEach(cat => {
      const listEl = mealLists[cat];
      const catItems = grouped[cat];
      const catCalories = catItems.reduce((acc, curr) => acc + (curr.calories || 0), 0);

      mealTotals[cat].textContent = `${catCalories.toLocaleString()} kcal`;

      if (catItems.length === 0) {
        listEl.innerHTML = `<li class="empty-state">No items logged for ${cat}</li>`;
      } else {
        listEl.innerHTML = catItems
          .map(item => createFoodItemHTML(item))
          .join('');
      }
    });
  }

  function createFoodItemHTML(item) {
    const macros = [];
    if (item.protein > 0) macros.push(`<span class="macro-tag p">P: ${item.protein}g</span>`);
    if (item.carbs > 0) macros.push(`<span class="macro-tag c">C: ${item.carbs}g</span>`);
    if (item.fat > 0) macros.push(`<span class="macro-tag f">F: ${item.fat}g</span>`);

    return `
      <li class="food-item" data-id="${item.id}">
        <div class="food-details">
          <span class="food-name">${escapeHTML(item.name)}</span>
          <div class="food-macros">
            ${macros.length > 0 ? macros.join(' &bull; ') : '<span style="color:#94a3b8">No macros specified</span>'}
          </div>
        </div>
        <div class="food-actions">
          <span class="food-calories-badge">${item.calories.toLocaleString()} kcal</span>
          <button class="delete-btn" data-action="delete" data-id="${item.id}" title="Remove entry">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </li>
    `;
  }

  function renderPresets() {
    presetsContainer.innerHTML = '';
    FOOD_PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `
        <span>${escapeHTML(preset.name)}</span>
        <span class="preset-cal">${preset.calories}</span>
      `;
      chip.title = `Add to ${mealTypeSelect.value} (${preset.calories} kcal, ${preset.protein}g P, ${preset.carbs}g C, ${preset.fat}g F)`;
      chip.addEventListener('click', () => {
        addEntry({
          name: preset.name,
          category: mealTypeSelect.value || preset.category,
          calories: preset.calories,
          protein: preset.protein,
          carbs: preset.carbs,
          fat: preset.fat
        });
        showToast(`Added ${preset.name} to ${mealTypeSelect.value || preset.category}`, 'success');
      });
      presetsContainer.appendChild(chip);
    });
  }

  // --- Actions ---
  function addEntry(data) {
    const newEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: currentDate,
      name: data.name.trim(),
      category: data.category || 'Breakfast',
      calories: Math.max(0, parseInt(data.calories, 10) || 0),
      protein: Math.max(0, parseFloat(data.protein) || 0),
      carbs: Math.max(0, parseFloat(data.carbs) || 0),
      fat: Math.max(0, parseFloat(data.fat) || 0),
      timestamp: Date.now()
    };

    entries.unshift(newEntry);
    persistEntries();
    renderCurrentDay();
  }

  function deleteEntry(id) {
    const itemIndex = entries.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      const removed = entries.splice(itemIndex, 1)[0];
      persistEntries();
      renderCurrentDay();
      showToast(`Removed "${removed.name}"`, 'info');
    }
  }

  function clearDay() {
    const count = entries.filter(item => item.date === currentDate).length;
    if (count === 0) {
      showToast('No entries to clear for this day', 'info');
      return;
    }

    if (window.confirm(`Clear all ${count} entries logged for ${formatHumanDate(currentDate)}?`)) {
      entries = entries.filter(item => item.date !== currentDate);
      persistEntries();
      renderCurrentDay();
      showToast(`Cleared ${count} entries for this day`, 'danger');
    }
  }

  function resetAllData() {
    if (window.confirm('Reset ALL stored tracker data? This will clear all days and reset your goal.')) {
      localStorage.removeItem(STORAGE_KEY_ENTRIES);
      localStorage.removeItem(STORAGE_KEY_GOAL);
      entries = [];
      dailyGoal = 2000;
      dailyGoalInput.value = dailyGoal;
      goalCaloriesEl.textContent = dailyGoal.toLocaleString();
      renderCurrentDay();
      showToast('All tracker data has been reset', 'danger');
    }
  }

  // --- Utility Functions ---
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, 2400);
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Form Submission
    addFoodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = foodNameInput.value.trim();
      const calories = parseInt(caloriesInput.value, 10);

      if (!name || isNaN(calories)) return;

      addEntry({
        name: name,
        category: mealTypeSelect.value,
        calories: calories,
        protein: proteinInput.value,
        carbs: carbsInput.value,
        fat: fatInput.value
      });

      showToast(`Logged "${name}" (${calories} kcal)`, 'success');

      // Reset form but keep selected meal category
      const currentCategory = mealTypeSelect.value;
      addFoodForm.reset();
      mealTypeSelect.value = currentCategory;
      foodNameInput.focus();
    });

    // Date Navigation
    prevDateBtn.addEventListener('click', () => shiftDate(-1));
    nextDateBtn.addEventListener('click', () => shiftDate(1));
    todayBtn.addEventListener('click', () => syncDate(getTodayDateString()));

    datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        syncDate(e.target.value);
      }
    });

    // Quick Add Buttons in Meal Headers
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mealType = btn.getAttribute('data-meal-type');
        mealTypeSelect.value = mealType;
        foodNameInput.focus();
        foodNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // Food Item Delete Delegation
    document.querySelector('.meals-container').addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('button[data-action="delete"]');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (id) deleteEntry(id);
      }
    });

    // Daily Goal Modal
    setGoalBtn.addEventListener('click', () => {
      dailyGoalInput.value = dailyGoal;
      goalModal.classList.remove('hidden');
      dailyGoalInput.focus();
    });

    closeGoalModal.addEventListener('click', () => {
      goalModal.classList.add('hidden');
    });

    cancelGoalBtn.addEventListener('click', () => {
      goalModal.classList.add('hidden');
    });

    goalModal.addEventListener('click', (e) => {
      if (e.target === goalModal) {
        goalModal.classList.add('hidden');
      }
    });

    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newGoal = parseInt(dailyGoalInput.value, 10);
      if (!isNaN(newGoal) && newGoal > 0) {
        saveGoal(newGoal);
        goalModal.classList.add('hidden');
        showToast(`Daily target set to ${newGoal.toLocaleString()} kcal`, 'success');
      }
    });

    // Storage Management Buttons
    clearDayBtn.addEventListener('click', clearDay);
    resetAllBtn.addEventListener('click', resetAllData);

    // Keyboard Shortcuts (Esc to close modal)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !goalModal.classList.contains('hidden')) {
        goalModal.classList.add('hidden');
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

