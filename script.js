(function () {
  const TOTAL_OUTCOMES = 36;

  if (window.Chart) {
    const rootStyles = getComputedStyle(document.documentElement);
    const chartFont =
      (rootStyles.getPropertyValue("--font-body") || "Lora")
        .replace(/['"]/g, "")
        .split(",")[0]
        .trim() || "Lora";
    const chartColor = rootStyles.getPropertyValue("--text-color") || "#2e2a23";

  }

  const corpsTable = [
    [0, 0, 0, 1, 1, 1, 1, 1, 2],
    [0, 0, 1, 1, 1, 1, 2, 2, 2],
    [0, 1, 1, 1, 1, 2, 2, 2, 3],
    [0, 1, 1, 1, 2, 2, 2, 3, 3],
    [1, 1, 1, 2, 2, 2, 3, 3, 4],
    [1, 1, 1, 2, 2, 3, 3, 4, 4],
  ];

  const corpsColumns = ["0", "1", "2", "3", "4", "5", "6", "7", "8+"];

  const armyTable = [
    [0, 1, 1, 2, 2, 3, 3, 4, 4, 5],
    [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    [1, 2, 2, 3, 3, 4, 4, 5, 5, 5],
    [1, 2, 3, 3, 4, 4, 5, 5, 7, 7],
    [2, 3, 3, 4, 4, 5, 5, 7, 7, 7],
    [2, 3, 4, 4, 5, 5, 7, 7, 7, 7],
  ];

  const armyColumns = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6-8",
    "9-11",
    "12-14",
    "15",
    "16+",
  ];

  const tableConfigs = {
    corps: {
      data: corpsTable,

      columns: corpsColumns,

      headerIndex: (header) => {
        const idx = corpsColumns.indexOf(header);

        return idx >= 0 ? idx : 0;
      },
    },

    army: {
      data: armyTable,

      columns: armyColumns,

      headerIndex: (header) => {
        const idx = armyColumns.indexOf(header);

        return idx >= 0 ? idx : 0;
      },
    },
  };

  const terrainEffects = {
    clear: { attacker: 0, defender: 0 },

    forest: { attacker: 0, defender: 0 },

    mountain: { attacker: -1, defender: 0 },

    swamp: { attacker: -1, defender: 0 },

    desert: { attacker: 0, defender: 0 },
  };

  const terrainLabels = {
    clear: "Clear",

    forest: "Forest",

    mountain: "Mountain",

    swamp: "Swamp",

    desert: "Desert",
  };

  const trenchEffects = {
    0: { attacker: 0, defender: 0 },

    1: { attacker: -1, defender: 1 },

    2: { attacker: -2, defender: 1 },
  };

  const tableLabelMap = { army: "Army", corps: "Corps" };

  function init() {
    const form = document.getElementById("combat-form");

    if (!form) return;

    const calculateBtn = document.getElementById("calculate-btn");

    const attackerTableSelect = document.getElementById("attacker-table");

    const attackerColumnSelect = document.getElementById("attacker-column");

    const attackerModifierInput = document.getElementById("attacker-cc");

    const neglectTrenchesCheckbox = document.getElementById("neglect-trenches");

    const defenderTableSelect = document.getElementById("defender-table");

    const defenderColumnSelect = document.getElementById("defender-column");

    const defenderModifierInput = document.getElementById("defender-cc");

    const terrainSelect = document.getElementById("terrain");

    const trenchLevelSelect = document.getElementById("trench-level");

    const attackerEffectiveSummaryEl = document.getElementById(
      "attacker-effective-summary",
    );

    const defenderEffectiveSummaryEl = document.getElementById(
      "defender-effective-summary",
    );

    const expectedAttackerEl = document.getElementById("expected-attacker");

    const expectedDefenderEl = document.getElementById("expected-defender");

    const expectedNetEl = document.getElementById("expected-net");

    const outcomeProbabilityEls = {
      attackerPlusTwo: document.getElementById("prob-attacker-plus-2"),
      attackerPlusOne: document.getElementById("prob-attacker-plus-1"),
      draw: document.getElementById("prob-draw"),
      defenderPlusOne: document.getElementById("prob-defender-plus-1"),
      defenderPlusTwo: document.getElementById("prob-defender-plus-2"),
    };

    const winProbabilityEls = {
      attacker: document.getElementById("prob-attacker-win"),
      draw: document.getElementById("prob-win-draw"),
      defender: document.getElementById("prob-defender-win"),
    };

    const gridBody = document.querySelector("#results-grid tbody");

    const attackerProbTable = document.querySelector(
      "#attacker-prob-table tbody",
    );

    const defenderProbTable = document.querySelector(
      "#defender-prob-table tbody",
    );

    const netProbTable = document.querySelector("#net-prob-table tbody");

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function safeNumber(value, fallback = 0) {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : fallback;
    }

    function signed(value) {
      return value > 0 ? `+${value}` : `${value}`;
    }

    function getTableConfig(key) {
      return tableConfigs[key] ?? tableConfigs.corps;
    }

    function populateColumnOptions(
      selectElement,
      tableKey,
      preserveValue = true,
    ) {
      if (!selectElement) return;

      const config = getTableConfig(tableKey);

      const previousValue = preserveValue ? selectElement.value : null;

      while (selectElement.firstChild) {
        selectElement.removeChild(selectElement.firstChild);
      }

      config.columns.forEach((label) => {
        const option = document.createElement("option");

        option.value = label;

        option.textContent = label;

        selectElement.appendChild(option);
      });

      if (
        preserveValue &&
        previousValue &&
        config.columns.includes(previousValue)
      ) {
        selectElement.value = previousValue;
      } else {
        selectElement.selectedIndex = 0;
      }
    }

    function renderEffectivePlaceholder(target, message) {
      if (!target) return;
      target.innerHTML = `<p class="effective-placeholder">${message}</p>`;
    }

    function markPending() {
      if (initializing || !hasCalculated) {
        return;
      }

      const pendingText = "Inputs changed. Press Calculate to refresh.";

      renderEffectivePlaceholder(attackerEffectiveSummaryEl, pendingText);
      renderEffectivePlaceholder(defenderEffectiveSummaryEl, pendingText);
    }

    function getFormValues() {
      const trenchLevelValue = trenchLevelSelect.value;

      const normalizedTrenchLevel = Object.prototype.hasOwnProperty.call(
        trenchEffects,
        trenchLevelValue,
      )
        ? trenchLevelValue
        : "0";

      return {
        attacker: {
          table: attackerTableSelect.value,

          column: attackerColumnSelect.value,
        },

        defender: {
          table: defenderTableSelect.value,

          column: defenderColumnSelect.value,
        },

        attackerModifier: safeNumber(attackerModifierInput.value, 0),

        defenderModifier: safeNumber(defenderModifierInput.value, 0),

        neglectTrenches: neglectTrenchesCheckbox.checked,

        terrain: terrainSelect.value,

        trenchLevel: normalizedTrenchLevel,
      };
    }

    function lookupLoss(table, roll, columnIndex) {
      const row = table[roll - 1];

      if (!row) return 0;

      const value = row[columnIndex];

      return Number.isFinite(value) ? value : 0;
    }

    function applyShift(baseIndex, shift, max) {
      const shifted = baseIndex + shift;

      if (shifted < 0) return 0;

      if (shifted >= max) return max - 1;

      return shifted;
    }

    function incrementMap(map, key) {
      const existing = map.get(key) ?? 0;

      map.set(key, existing + 1);
    }

    function mapToDistribution(map) {
      const entries = Array.from(map.entries()).map(([key, count]) => ({
        value: Number(key),

        count,

        probability: count / TOTAL_OUTCOMES,
      }));

      entries.sort((a, b) => a.value - b.value);

      return entries;
    }

    function getMode(distribution) {
      if (distribution.length === 0) return null;

      return distribution.reduce((best, current) => {
        if (
          !best ||
          current.count > best.count ||
          (current.count === best.count && current.value < best.value)
        ) {
          return current;
        }

        return best;
      }, null);
    }

    function updateProbabilityTable(tableBody, distribution) {
      tableBody.innerHTML = "";

      if (distribution.length === 0) {
        const row = document.createElement("tr");

        row.innerHTML = '<td colspan="2">None</td>';

        tableBody.appendChild(row);

        return;
      }

      distribution.forEach(({ value, probability }) => {
        const row = document.createElement("tr");

        const probPercent = (probability * 100).toFixed(
          probability > 0 && probability < 0.1 ? 2 : 1,
        );

        row.innerHTML = `<td>${value}</td><td>${probPercent}%</td>`;

        tableBody.appendChild(row);
      });
    }

    function formatProbability(probability) {
      if (!Number.isFinite(probability) || probability <= 0) {
        return "0%";
      }

      const digits = probability > 0 && probability < 0.1 ? 2 : 1;

      return `${(probability * 100).toFixed(digits)}%`;
    }

    function updateProbabilityGroup(targets, probabilities) {
      if (!targets) return;

      Object.entries(targets).forEach(([key, element]) => {
        if (!element) return;

        element.textContent = formatProbability(probabilities[key] ?? 0);
      });
    }

    function updateOutcomeProbabilities(probabilities) {
      updateProbabilityGroup(outcomeProbabilityEls, probabilities);
    }

    function updateWinProbabilities(probabilities) {
      updateProbabilityGroup(winProbabilityEls, probabilities);
    }

    function formatRoll(base, effective) {
      return base === effective ? `${base}` : `${base}->${effective}`;
    }

    function buildSummaryText(
      sideLabel,
      tableLabel,
      baseColumnLabel,
      effectiveColumnLabel,
      totalShift,
      shiftBreakdown,
      modifier,
      terrainLabel,
      trenchesIgnored,
      trenchLevel,
    ) {
      const lines = [];

      const breakdownText = shiftBreakdown.length
        ? ` (${shiftBreakdown.join(", ")})`
        : "";

      const trenchDisplay = trenchesIgnored
        ? "Ignored"
        : trenchLevel === "0"
          ? "Level 0 (none)"
          : `Level ${trenchLevel}`;

      lines.push(`${sideLabel}: ${tableLabel} table`);

      lines.push(`Base column: ${baseColumnLabel}`);

      lines.push(`Column shift: ${signed(totalShift)}${breakdownText}`);

      lines.push(`Effective column: ${effectiveColumnLabel}`);

      lines.push(`Die modifier: ${signed(modifier)}`);

      const listItems = lines
        .map((line) => {
          const separatorIndex = line.indexOf(":");
          if (separatorIndex > -1) {
            const label = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();
            return `<li><span class="effective-label">${label}:</span> <span class="effective-value">${value}</span></li>`;
          }
          return `<li><span class="effective-value">${line}</span></li>`;
        })
        .join("");

      return `<ul class="effective-list">${listItems}</ul>`;
    }

    function renderOutcomeGrid(matrix) {
      const rowsHtml = matrix

        .map((row, idx) => {
          const cellsHtml = row

            .map((cell) => {
              const {
                attackerLoss,
                defenderLoss,
                net,
                attackerRoll,
                defenderRoll,
                attackerEffectiveRoll,
                defenderEffectiveRoll,
              } = cell;

              const magnitude = Math.abs(net);
              let netClass = "net-zero";

              if (net !== 0) {
                const tier = magnitude >= 3 ? 3 : magnitude;
                netClass =
                  net > 0 ? `net-positive-${tier}` : `net-negative-${tier}`;
              }

              const netDisplay = net > 0 ? `+${net}` : net.toString();

              return `

                <td class="${netClass}">

                  <div class="losses">Att: ${attackerLoss} | Def: ${defenderLoss}</div>

                  <div class="roll">Net ${netDisplay}</div>

                  <div class="roll">Rolls Att ${formatRoll(attackerRoll, attackerEffectiveRoll)} | Def ${formatRoll(defenderRoll, defenderEffectiveRoll)}</div>

                </td>

              `;
            })

            .join("");

          return `<tr><th scope="row">${idx + 1}</th>${cellsHtml}</tr>`;
        })

        .join("");

      gridBody.innerHTML = rowsHtml;
    }

    function updateSummary(
      expectedAttacker,
      expectedDefender,
      attackerMode,
      defenderMode,
      expectedNet,
    ) {
      expectedAttackerEl.textContent = expectedAttacker.toFixed(2);

      expectedDefenderEl.textContent = expectedDefender.toFixed(2);

      expectedNetEl.textContent = expectedNet.toFixed(2);
    }

    function recalculate() {
      const values = getFormValues();

      const attackerConfig = getTableConfig(values.attacker.table);

      const defenderConfig = getTableConfig(values.defender.table);

      const attackerBaseColumnIndex = attackerConfig.headerIndex(
        values.attacker.column,
      );

      const defenderBaseColumnIndex = defenderConfig.headerIndex(
        values.defender.column,
      );

      const terrainEffect =
        terrainEffects[values.terrain] ?? terrainEffects.clear;

      const trenchEffect =
        trenchEffects[values.trenchLevel] ?? trenchEffects[0];

      const terrainLabel = terrainLabels[values.terrain] ?? "Unknown";

      const attackerTerrainShift = terrainEffect.attacker ?? 0;

      const defenderTerrainShift = terrainEffect.defender ?? 0;

      const attackerTrenchShift = values.neglectTrenches
        ? 0
        : (trenchEffect.attacker ?? 0);

      const defenderTrenchShift = values.neglectTrenches
        ? 0
        : (trenchEffect.defender ?? 0);

      const attackerShiftTotal = attackerTerrainShift + attackerTrenchShift;

      const defenderShiftTotal = defenderTerrainShift + defenderTrenchShift;

      const attackerColumnIndex = applyShift(
        attackerBaseColumnIndex,
        attackerShiftTotal,
        attackerConfig.columns.length,
      );

      const defenderColumnIndex = applyShift(
        defenderBaseColumnIndex,
        defenderShiftTotal,
        defenderConfig.columns.length,
      );

      const attackerLossCounts = new Map();

      const defenderLossCounts = new Map();

      const netLossCounts = new Map();

      let attackerLossSum = 0;

      let defenderLossSum = 0;

      let netLossSum = 0;

      const matrix = [];

      for (let attackerRoll = 1; attackerRoll <= 6; attackerRoll += 1) {
        const row = [];

        for (let defenderRoll = 1; defenderRoll <= 6; defenderRoll += 1) {
          const attackerEffectiveRoll = clamp(
            attackerRoll + values.attackerModifier,
            1,
            6,
          );

          const defenderEffectiveRoll = clamp(
            defenderRoll + values.defenderModifier,
            1,
            6,
          );

          const defenderLoss = lookupLoss(
            attackerConfig.data,
            attackerEffectiveRoll,
            attackerColumnIndex,
          );

          const attackerLoss = lookupLoss(
            defenderConfig.data,
            defenderEffectiveRoll,
            defenderColumnIndex,
          );

          const net = attackerLoss - defenderLoss;

          incrementMap(attackerLossCounts, attackerLoss);

          incrementMap(defenderLossCounts, defenderLoss);

          incrementMap(netLossCounts, net);

          attackerLossSum += attackerLoss;

          defenderLossSum += defenderLoss;

          netLossSum += net;

          row.push({
            attackerRoll,

            defenderRoll,

            attackerEffectiveRoll,

            defenderEffectiveRoll,

            attackerLoss,

            defenderLoss,

            net,
          });
        }

        matrix.push(row);
      }

      const attackerDistribution = mapToDistribution(attackerLossCounts);

      const defenderDistribution = mapToDistribution(defenderLossCounts);

      const netDistribution = mapToDistribution(netLossCounts);

      const expectedAttacker = attackerLossSum / TOTAL_OUTCOMES;

      const expectedDefender = defenderLossSum / TOTAL_OUTCOMES;

      const expectedNet = netLossSum / TOTAL_OUTCOMES;

      const attackerMode = getMode(attackerDistribution);

      const defenderMode = getMode(defenderDistribution);

      renderOutcomeGrid(matrix);

      updateSummary(
        expectedAttacker,
        expectedDefender,
        attackerMode,
        defenderMode,
        expectedNet,
      );

      updateProbabilityTable(attackerProbTable, attackerDistribution);

      updateProbabilityTable(defenderProbTable, defenderDistribution);

      updateProbabilityTable(netProbTable, netDistribution);

      const probabilityFor = (predicate) =>
        netDistribution.reduce((total, entry) => {
          return predicate(entry.value) ? total + entry.probability : total;
        }, 0);

      updateOutcomeProbabilities({
        attackerPlusTwo: probabilityFor((value) => value <= -2),
        attackerPlusOne: probabilityFor((value) => value === -1),
        draw: probabilityFor((value) => value === 0),
        defenderPlusOne: probabilityFor((value) => value === 1),
        defenderPlusTwo: probabilityFor((value) => value >= 2),
      });

      updateWinProbabilities({
        attacker: probabilityFor((value) => value < 0),
        draw: probabilityFor((value) => value === 0),
        defender: probabilityFor((value) => value > 0),
      });

      const attackerShiftBreakdown = [];

      if (attackerTerrainShift !== 0)
        attackerShiftBreakdown.push(`terrain ${signed(attackerTerrainShift)}`);

      if (!values.neglectTrenches && attackerTrenchShift !== 0)
        attackerShiftBreakdown.push(`trench ${signed(attackerTrenchShift)}`);

      const defenderShiftBreakdown = [];

      if (defenderTerrainShift !== 0)
        defenderShiftBreakdown.push(`terrain ${signed(defenderTerrainShift)}`);

      if (!values.neglectTrenches && defenderTrenchShift !== 0)
        defenderShiftBreakdown.push(`trench ${signed(defenderTrenchShift)}`);

      const attackerBaseLabel =
        attackerConfig.columns[attackerBaseColumnIndex] ??
        attackerConfig.columns[0];

      const defenderBaseLabel =
        defenderConfig.columns[defenderBaseColumnIndex] ??
        defenderConfig.columns[0];

      const attackerEffectiveLabel =
        attackerConfig.columns[attackerColumnIndex] ??
        attackerConfig.columns[attackerConfig.columns.length - 1];

      const defenderEffectiveLabel =
        defenderConfig.columns[defenderColumnIndex] ??
        defenderConfig.columns[defenderConfig.columns.length - 1];

      attackerEffectiveSummaryEl.innerHTML = buildSummaryText(
        "Attacker",

        tableLabelMap[values.attacker.table] ?? "Corps",

        attackerBaseLabel,

        attackerEffectiveLabel,

        attackerShiftTotal,

        attackerShiftBreakdown,

        values.attackerModifier,

        terrainLabel,

        values.neglectTrenches,

        values.trenchLevel,
      );

      defenderEffectiveSummaryEl.innerHTML = buildSummaryText(
        "Defender",

        tableLabelMap[values.defender.table] ?? "Corps",

        defenderBaseLabel,

        defenderEffectiveLabel,

        defenderShiftTotal,

        defenderShiftBreakdown,

        values.defenderModifier,

        terrainLabel,

        values.neglectTrenches,

        values.trenchLevel,
      );

      hasCalculated = true;
    }

    attackerTableSelect.addEventListener("change", () => {
      populateColumnOptions(
        attackerColumnSelect,
        attackerTableSelect.value,
        false,
      );

      markPending();
    });

    defenderTableSelect.addEventListener("change", () => {
      populateColumnOptions(
        defenderColumnSelect,
        defenderTableSelect.value,
        false,
      );

      markPending();
    });

    attackerColumnSelect.addEventListener("change", markPending);
    defenderColumnSelect.addEventListener("change", markPending);
    attackerModifierInput.addEventListener("input", markPending);
    defenderModifierInput.addEventListener("input", markPending);
    neglectTrenchesCheckbox.addEventListener("change", markPending);
    terrainSelect.addEventListener("change", markPending);
    trenchLevelSelect.addEventListener("change", markPending);
    calculateBtn.addEventListener("click", () => {
      recalculate();
    });

    form.addEventListener("submit", (event) => event.preventDefault());

    populateColumnOptions(
      attackerColumnSelect,
      attackerTableSelect.value,
      false,
    );

    populateColumnOptions(
      defenderColumnSelect,
      defenderTableSelect.value,
      false,
    );

    initializing = false;

    recalculate();
  }

  init();
})();
