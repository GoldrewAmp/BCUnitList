//@ts-check

import SETTINGS from "../../../assets/settings.js";
import UnitData from "../../data/unit-data.js";
import * as StatCalculator from "../../helper/calculate-stats.js";
import { getValuesFromRow, observeRowChange, unobserveRowChange } from "../../helper/link-row.js";

/**
 * Creates a stat display tr that syncs with the unit's modifiable attributes and the user's cat base.
 * @param {import("../../data/unit-data").UNIT_DATA} unitData The unit's data, including their stats.
 * @param {HTMLTableRowElement} mainRow The unit row that this stat row is associated with.
 * @returns {{ row: HTMLTableRowElement, callback: () => void }} A table row that displays the units stats and allows performing calculations on them that update based on the unit's modifiable attributes, as well as a clean up callback that should be called before removing the element.
 */
export default function createStatRow(unitData, mainRow) {
    const statRow = document.createElement("tr");
    statRow.classList.add("stat-mod-row");

    const rowBox = document.createElement("td");
    rowBox.colSpan = 9;

    const statTable = document.createElement("div");
    statTable.classList.add("unit-stat-table");
    
    const recordClone = UnitData.dataToRecord(unitData);

    const { statBox: costStat, onUpdate: updateCost } = createSmartStatBox("Cost", StatCalculator.calculateCost(unitData.stats[unitData.current_form].cost, recordClone, unitData), "¢");
    const { statBox: healthStat, onUpdate: updateHealth } = createSmartStatBox("Health", StatCalculator.calculateHealth(unitData.stats[unitData.current_form].health, recordClone, unitData));
    const { statBox: damageStat, onUpdate: updateDamage } = createSmartStatBox("Damage", StatCalculator.calculateDamage(unitData.stats[unitData.current_form].damage, recordClone, unitData));
    const { statBox: knockbackStat, onUpdate: updateKnockbacks } = createSmartStatBox("Knockbacks", StatCalculator.calculateKnockbacks(unitData.stats[unitData.current_form].knockbacks, recordClone, unitData));
    const { statBox: rechargeStat, onUpdate: updateRecharge } = createSmartStatBox("Recharge", StatCalculator.calculateRechargeTime(unitData.stats[unitData.current_form].cooldown, recordClone, unitData), " sec");
    const { statBox: rangeStat, onUpdate: updateRange } = createSmartStatBox("Range", StatCalculator.calculateRange(unitData.stats[unitData.current_form].range, recordClone, unitData));
    const { statBox: speedStat, onUpdate: updateSpeed } = createSmartStatBox("Speed", StatCalculator.calculateSpeed(unitData.stats[unitData.current_form].speed, recordClone, unitData));

    const doubleBox = document.createElement("div");
    doubleBox.classList.add("double-stat-box");
    doubleBox.append(rangeStat, speedStat);

    const { iconBox: traitBox, onUpdate: updateTraits } = createIconMultiBox("Target Traits:", unitData.stats.map(s => s.traits.map(t => { return { imagePath: `./assets/img/ability/Target_${t}.png`, label: t }})), unitData.current_form);
    traitBox.classList.add("unit-stat-traits");

    const { iconBox: abilities, onUpdate: updateAbilities } = createIconMultiBox("Abilities:", unitData.stats.map(s => s.abilities.filter(a => !SETTINGS.targettingAbilities.includes(a)).map(a => { return { imagePath: `./assets/img/ability/${a}.png`, label: a.replaceAll("_", " ") }})), unitData.current_form);
    abilities.classList.add("unit-stat-abilities");

    const { targetBox: targetting, onUpdate: updateTargetting } = createTargetting(unitData.stats.map(s => {
        const output = [];
        output.push({ imagePath: `./assets/img/ability/${s.has_area ? "Area" : "Single"}_Attack.png`, label: `${s.has_area ? "Area" : "Single"} Attack` });

        s.abilities.filter(a => SETTINGS.targettingAbilities.includes(a)).forEach(a => output.push({ imagePath: `./assets/img/ability/${a}.png`, label: a.replaceAll("_", "") }));

        return output;
    }), unitData.current_form);

    let getOptionSettings = null;

    const updateFuncCombined = async () => {
        const updatedRow = getValuesFromRow(mainRow);

        const calculatorOptions = getOptionSettings();

        updateCost(StatCalculator.calculateCost(unitData.stats[updatedRow.current_form].cost, updatedRow, unitData, calculatorOptions));
        updateHealth(StatCalculator.calculateHealth(unitData.stats[updatedRow.current_form].health, updatedRow, unitData, calculatorOptions));
        updateDamage(StatCalculator.calculateDamage(unitData.stats[updatedRow.current_form].damage, updatedRow, unitData, calculatorOptions));
        updateKnockbacks(StatCalculator.calculateKnockbacks(unitData.stats[updatedRow.current_form].knockbacks, updatedRow, unitData, calculatorOptions));
        updateRecharge(StatCalculator.calculateRechargeTime(unitData.stats[updatedRow.current_form].cooldown, updatedRow, unitData, calculatorOptions));
        updateRange(StatCalculator.calculateRange(unitData.stats[updatedRow.current_form].range, updatedRow, unitData, calculatorOptions));
        updateSpeed(StatCalculator.calculateSpeed(unitData.stats[updatedRow.current_form].speed, updatedRow, unitData, calculatorOptions));

        updateTraits(updatedRow.current_form);
        updateAbilities(updatedRow.current_form);
        updateTargetting(updatedRow.current_form);
    };
    const { element: calculator, valueCallback: _getOptionSettings } = createStatOptionBox(unitData, updateFuncCombined);
    getOptionSettings = _getOptionSettings;

    statTable.append(costStat, traitBox, targetting, healthStat, damageStat, abilities, calculator, knockbackStat, rechargeStat, doubleBox);
    rowBox.appendChild(statTable);

    statRow.appendChild(rowBox);

    observeRowChange(mainRow, updateFuncCombined);
    const callback = () => unobserveRowChange(mainRow, updateFuncCombined);

    return { row: statRow, callback: callback };
}

/**
 * Creates a single simple stat boxes for a calculable stat.
 * @param {string} statName The name of the stat in the box.
 * @param {number} calcValue The calculated initial value for the stat box.
 * @param {string} unit The units to use for the stat.
 * @returns {{ statBox: HTMLElement, onUpdate: (calcValue: number) => void }} Returns both the created stat box and a function to update it's displayed stat.
 */
function createSmartStatBox(statName, calcValue, unit = "") {
    const output = document.createElement("span");
    output.classList.add("unit-stat-calc-cell");

    const cellLabel = document.createElement("h6");
    cellLabel.classList.add("cell-manip-label");
    cellLabel.textContent = statName + ":";

    const cellContent = document.createElement("h6");
    cellContent.classList.add("cell-manip-value");
    cellContent.textContent = formatStatNum(calcValue) + unit;

    output.append(cellLabel, cellContent);

    const onUpdate = (/** @type {number} */ calcValue) => { cellContent.textContent = formatStatNum(calcValue) + unit };
    return { statBox: output, onUpdate: onUpdate };
}

/**
 * Creates a box containing multiple centered and evenly spaced icons.
 * @param {string} label The name of the icon box.
 * @param {{ imagePath: string, label: string }[][]} iconInfo The icons to be added for each form.
 * @param {number} currentForm The initial form to use.
 * @returns {{ iconBox: HTMLElement, onUpdate: (form: number) => void }} Returns both the created icon box and a function to update it's displayed icons.
 */
function createIconMultiBox(label, iconInfo, currentForm) {
    const output = document.createElement("div");
    output.classList.add("unit-stat-multi-icon-wrapper");

    const labelElm = document.createElement("h6");
    labelElm.textContent = label;

    const iconWrapper = document.createElement("div");
    iconWrapper.classList.add("unit-stat-icon-box");
    appendIcons(iconWrapper, iconInfo[currentForm]);

    output.append(labelElm, iconWrapper);
    const onUpdate = (/** @type {number} */ form) => {
        iconWrapper.innerHTML = "";
        appendIcons(iconWrapper, iconInfo[form]);
    };

    return { iconBox: output, onUpdate: onUpdate };
}

/**
 * Helper function that appends icons to a div.
 * @param {HTMLDivElement} wrapper The container that icons are appended to.
 * @param {{ imagePath: string, label: string }[]} iconDataList A list of the icons that should be added to the wrapper.
 */
function appendIcons(wrapper, iconDataList) {
    if(iconDataList.length === 0) {
        const emptyText = document.createElement("p");
        emptyText.textContent = "None";
        wrapper.appendChild(emptyText);
    } else {
        for(const icon of iconDataList) {
            const subIcon = document.createElement("img");
            subIcon.classList.add("unit-stat-power-icon");
            subIcon.src = icon.imagePath;
            subIcon.title = icon.label;
            wrapper.appendChild(subIcon);
        }
    }
}

/**
 * Creates a box containing targetting icons.
 * @param {{ imagePath: string, label: string }[][]} targetTypes the targetting for each form.
 * @param {number} currentForm The initial form to use.
 * @returns {{ targetBox: HTMLElement, onUpdate: (form: number) => void }} Returns both the created targetting types box and a function to update it's displayed icons.
 */
function createTargetting(targetTypes, currentForm) {
    const output = document.createElement("div");
    output.classList.add("unit-stat-targetting");
    output.classList.add("double-stat-box");

    const labelWrapper = document.createElement("div");
    labelWrapper.classList.add("v-align");

    const targetLabel = document.createElement("h6");
    targetLabel.textContent = "Targetting:";
    labelWrapper.appendChild(targetLabel);

    const targetIconBox = document.createElement("div");
    targetIconBox.classList.add("unit-stat-icon-box");

    appendIcons(targetIconBox, targetTypes[currentForm]);
    const onUpdate = (/** @type {number} */ form) => {
        targetIconBox.innerHTML = "";
        appendIcons(targetIconBox, targetTypes[form]);
    };

    output.append(labelWrapper, targetIconBox);
    return { targetBox: output, onUpdate: onUpdate };
}

/**
 * Rounds a number to the nearest 0.01 and converts it to a locale-appropriate string.
 * @param {number} val The value to round.
 * @returns {string} The value rounded to the nearest 0.01 and converted to a string.
 */
function formatStatNum(val) {
  const rounded = Math.round(val * 100) / 100;
  return parseFloat(rounded.toFixed(2)).toLocaleString();
}

/**
 * Creates a stat display tr that syncs with the unit's modifiable attributes and the user's cat base.
 * @param {import("../../data/unit-data").UNIT_DATA} unitData The unit's data, including their stats.
 * @param {() => void} updateCallback A function to call when an option changes.
 * @returns {{element: HTMLDivElement, valueCallback: () => import("../../helper/calculate-stats.js").CALCULATOR_OPTIONS}} An object consisting of the stat box's options, and a callback that can be called to get the value of each option.
 */
function createStatOptionBox(unitData, updateCallback) {
    const calculator = document.createElement("div");
    calculator.classList.add("unit-stat-options");

    const fullLabel = document.createElement("h5");
    fullLabel.classList.add("option-title-box");
    fullLabel.textContent = "Stat Modifiers";

    const traitSelectionMultiBox = document.createElement("div");
    traitSelectionMultiBox.classList.add("unit-stat-icon-box");

    for(let x = 0; x < SETTINGS.traits.length; x++) {
        const traitIconBox = document.createElement("img");
        traitIconBox.dataset.trait = SETTINGS.traits[x];
        traitIconBox.title = SETTINGS.traits[x];
        traitIconBox.classList.add("unit-stat-power-icon");

        if(StatCalculator.DEFAULT_CALCULATOR_OPTIONS.targetTraits.includes(SETTINGS.traits[x])) {
            traitIconBox.classList.add("option-icon-targetted");
        }

        traitIconBox.src = `./assets/img/ability/Target_${SETTINGS.traits[x]}.png`;
        traitIconBox.onclick = () => {
            traitIconBox.classList.toggle("option-icon-targetted");
            updateCallback();
        }
        traitSelectionMultiBox.appendChild(traitIconBox);
    }
    const traitWrapper = createOptionLabel("Enemy Trait(s)", traitSelectionMultiBox);

    const subTraitSelectionMultiBox = document.createElement("div");
    subTraitSelectionMultiBox.classList.add("unit-stat-icon-box");

    for(let x = 0; x < SETTINGS.subTraits.length; x++) {
        const subTraitIconBox = document.createElement("img");
        subTraitIconBox.dataset.subTrait = SETTINGS.subTraits[x];
        subTraitIconBox.title = SETTINGS.subTraits[x];
        subTraitIconBox.classList.add("unit-stat-power-icon");

        if(StatCalculator.DEFAULT_CALCULATOR_OPTIONS.targetSubTraits.includes(SETTINGS.subTraits[x])) {
            subTraitIconBox.classList.add("option-icon-targetted");
        }

        subTraitIconBox.src = `./assets/img/ability/${SETTINGS.subTraitKillers[x]}.png`;
        subTraitIconBox.onclick = () => {
            subTraitIconBox.classList.toggle("option-icon-targetted");
            updateCallback();
        }
        subTraitSelectionMultiBox.appendChild(subTraitIconBox);
    }
    const subTraitWrapper = createOptionLabel("Enemy Sub Trait(s)", subTraitSelectionMultiBox);

    const fixedLevelOptions = document.createElement("button");
    fixedLevelOptions.classList.add("option-level-switch");
    fixedLevelOptions.dataset.index = `${StatCalculator.DEFAULT_CALCULATOR_OPTIONS.testLevelValue}`;
    fixedLevelOptions.textContent = ["Current Level", "Level 30", "Level 50", "Level MAX"][StatCalculator.DEFAULT_CALCULATOR_OPTIONS.testLevelValue];
    fixedLevelOptions.onclick = () => {
        switch(parseInt(fixedLevelOptions.dataset.index ?? "0")) {
            case StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_30:
                fixedLevelOptions.dataset.index = `${StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_50}`;
                fixedLevelOptions.textContent = "Level 50";
                break;
            case StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_50:
                fixedLevelOptions.dataset.index = `${StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_MAX}`;
                fixedLevelOptions.textContent = "Level MAX";
                break;
            case StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_MAX:
                fixedLevelOptions.dataset.index = `${StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_CURRENT}`;
                fixedLevelOptions.textContent = "Current Level";
                break;
            case StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_CURRENT:
            default:
                fixedLevelOptions.dataset.index = `${StatCalculator.CALCULATOR_LEVEL_OPTIONS.LEVEL_30}`;
                fixedLevelOptions.textContent = "Level 30";
                break;
        }

        updateCallback();
    };
    const levelOptionWrapper = createOptionLabel("Fixed Unit Level", fixedLevelOptions);

    const talentCheckbox = document.createElement("input");
    talentCheckbox.type = "checkbox";
    talentCheckbox.checked = StatCalculator.DEFAULT_CALCULATOR_OPTIONS.includeTalents;
    const talentCheckWrapper = createOptionLabel("Include Talents", talentCheckbox);
    talentCheckWrapper.title = "Whether the unit's stats include the effect of talents.";
    talentCheckWrapper.classList.add("option-checkbox-align");
    if(unitData.talents.length === 0 && unitData.ultra_talents.length === 0) {
        talentCheckbox.checked = false;
        talentCheckWrapper.classList.add("hidden");
    }
    talentCheckbox.onchange = () => updateCallback();

    const orbCheckbox = document.createElement("input");
    orbCheckbox.type = "checkbox";
    orbCheckbox.checked = StatCalculator.DEFAULT_CALCULATOR_OPTIONS.includeOrbs;
    const orbCheckWrapper = createOptionLabel("Include Orbs", orbCheckbox);
    orbCheckWrapper.title = "Whether the unit's stats include the effect of orbs.";
    orbCheckWrapper.classList.add("option-checkbox-align");
    if(unitData.orb.length === 0) {
        orbCheckbox.checked = false;
        orbCheckWrapper.classList.add("hidden");
    }
    orbCheckbox.onchange = () => updateCallback();

    const ignoreFormCheckbox = document.createElement("input");
    ignoreFormCheckbox.title = "Normally, talents are only active for units in TF, and ultra talents are only active for units in UF. This option controls whether that rule is followed.";
    ignoreFormCheckbox.type = "checkbox";
    ignoreFormCheckbox.checked = StatCalculator.DEFAULT_CALCULATOR_OPTIONS.talentIgnoreForm;
    const ignoreFormWrapper = createOptionLabel("Talents require TF/UF", ignoreFormCheckbox);
    ignoreFormWrapper.title = "Normally, talents are only active for units in TF, and ultra talents are only active for units in UF. This option controls whether that rule is followed.";
    ignoreFormWrapper.classList.add("option-checkbox-align");
    if(unitData.talents.length === 0 && unitData.ultra_talents.length === 0) {
        ignoreFormWrapper.classList.add("hidden");
    }
    ignoreFormCheckbox.onchange = () => updateCallback();
 
    calculator.append(fullLabel, traitWrapper, subTraitWrapper, levelOptionWrapper, talentCheckWrapper, ignoreFormWrapper, orbCheckWrapper);

    const callback = () => {
        const output = {
            // @ts-ignore Never using vscode hints for JS every again aaaaa
            targetTraits: [...traitSelectionMultiBox.querySelectorAll(".option-icon-targetted")].map(i => i.dataset.trait),
            // @ts-ignore Never using vscode hints for JS every again aaaaa 2
            targetSubTraits: [...subTraitSelectionMultiBox.querySelectorAll(".option-icon-targetted")].map(i => i.dataset.subTrait),
            // @ts-ignore Seriously
            testLevelValue: parseInt(fixedLevelOptions.dataset.index),
            includeTalents: talentCheckbox.checked,
            includeOrbs: orbCheckbox.checked,
            eocChapterPrice: 2,
            talentIgnoreForm: ignoreFormCheckbox.checked
        };

        return output;
    };

    return { element: calculator, valueCallback: callback };
}

/**
 * Attaches a a label to an HTML element.
 * @param {string} labelText Text to put in the label.
 * @param {HTMLElement} element The element to attach the label to.
 * @returns {HTMLDivElement} An element containing the provided element and its label.
 */
function createOptionLabel(labelText, element) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("option-label-box");

    const label = document.createElement("h6");
    label.textContent = labelText;

    wrapper.append(label, element);
    return wrapper;
}