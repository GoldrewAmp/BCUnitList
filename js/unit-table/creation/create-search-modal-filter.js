// @ts-check
import SETTINGS from "../../../assets/settings.js";
import UnitData from "../../data/unit-data.js";
import { getUnitTraitTargets } from "../../helper/calculate-stat-mult.js";
import { calculateCost, calculateDamage, calculateHealth, calculateKnockbacks, calculateRange, calculateRechargeTime, calculateSpeed, CALCULATOR_LEVEL_OPTIONS } from "../../helper/calculate-stats.js";

const rarityMap = { N: "Normal", EX: "Special", RR: "Rare", SR: "Super Rare", UR: "Uber Rare", LR: "Legend Rare" };
/**
 * Creates a search filter element.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => number[] }} An object containing the created input, and a function which determines which forms of a unit meet the filter.
*/
export function createNameFilterInput() {
    const output = {};

    output.obj = document.createElement("input");
    output.obj.id = "advanced-name-filter";
    output.obj.type = "text";
    output.obj.maxLength = 60;
    output.obj.placeholder = "Search for ID/Name...";

    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => {
        const unitNames = [u.normal_form, u.evolved_form, u.true_form, u.ultra_form];
        return [...new Array(u.max_form + 1).keys()].filter(i => unitNames[i]?.toLowerCase().includes(output.obj.value.trim().toLowerCase()) ?? false);
    }

    return output;
}

/**
 * Creates a search filter element.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => boolean }} An object containing the created input, and a function which determines if the unit is owned.
 */
export function createOwnedFilterInput() {
    const output = {};

    const input = document.createElement("input");
    input.id = "advanced-owned-filter";
    input.type = "checkbox";
    input.checked = true;

    const label = document.createElement("label");
    label.textContent = "Only Show Owned";
    label.title = "Search results will only include units and upgrades currently unlocked"
    label.htmlFor = "advanced-owned-filter";

    output.obj = document.createElement("div");
    output.obj.id = "advanced-owned-wrapper";
    output.obj.classList.add("advaced-label-spacer");
    output.obj.append(label, input);

    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => !input.checked || u.level > 0;

    return output;
}

/**
 * Creates a search filter element.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => boolean }} An object containing the created input, and a function which determines if the unit is one of the selected rarities.
 */
export function createRarityFilterInput() {
    const output = {};

    const wrapper = document.createElement("div");
    wrapper.classList.add("advanced-wrapper");

    const wrapperLabel = document.createElement("h4");
    wrapperLabel.textContent = "Rarity";

    const wrapperContent = document.createElement("div");
    wrapperContent.id = "advanced-rarity-spacer";

    for(const rarity of ["Normal", "Special", "Rare", "Super Rare", "Uber Rare", "Legend Rare"]) {
        const btn = document.createElement("button");
        btn.classList.add("advanced-rarity-selector", "inactive");
        btn.classList.add(`${rarity.toLowerCase().replaceAll(" ", "-")}-color`);
        if(rarity === "Legend Rare") {
            btn.classList.add("legend-rare-animation");
        }
        btn.textContent = rarity;

        btn.onclick = () => btn.classList.toggle("inactive");
        wrapperContent.appendChild(btn);
    }

    wrapper.append(wrapperLabel, wrapperContent);
    output.obj = wrapper;

    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => {
        const rarities = [...wrapperContent.querySelectorAll(".advanced-rarity-selector")];
        return rarities.every(r => r.classList.contains("inactive")) || rarities.some(r => !r.classList.contains("inactive") && r.textContent === rarityMap[u.rarity]);
    };

    return output;
}

/**
 * Creates a search filter element.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => boolean[][] }} An object containing the created input, and a function which determines which forms of a unit meet the filter.
 */
export function createTargetTraitFilterInput() {
    const output = {};

    const wrapper = document.createElement("div");
    wrapper.classList.add("advanced-wrapper");

    const wrapperLabel = document.createElement("h4");
    wrapperLabel.textContent = "Target Traits";

    const wrapperContent = document.createElement("div");
    wrapperContent.id = "advanced-trait-spacer";

    const excludeAllInput = document.createElement("input");
    excludeAllInput.id = "advanced-no-all-filter";
    excludeAllInput.type = "checkbox";
    excludeAllInput.checked = true;

    const excludeAllLabel = document.createElement("label");
    excludeAllLabel.textContent = 'Exclude "Target All"';
    excludeAllLabel.title = "If you are filtering for target traits, search results will not include units who target every (or every non-metal) trait"
    excludeAllLabel.htmlFor = "advanced-no-all-filter";

    const spacer = document.createElement("div");
    spacer.classList.add("advaced-label-spacer", "exclude-all-wrapper");
    spacer.append(excludeAllLabel, excludeAllInput);

    for(const trait of SETTINGS.traits) {
        const btnWrapper = document.createElement("div");
        btnWrapper.classList.add("advanced-trait-selector-wrapper", "inactive");
        btnWrapper.dataset.trait = trait;

        const btn = document.createElement("img");
        btn.classList.add("advanced-trait-selector");
        btn.src = `./assets/img/ability/Target_${trait}.png`;
        btn.title = trait;

        const btnSlash = document.createElement("span");
        btnSlash.classList.add("advanced-trait-slash");
        btnSlash.title = trait;
        btnSlash.innerHTML = `
        <svg viewBox="0 0 100 100">
            <line x1="0" y1="100" x2="100" y2="0" />
        </svg>`;

        btnWrapper.onclick = () => btnWrapper.classList.toggle("inactive");
        btnWrapper.append(btn, btnSlash);
        wrapperContent.appendChild(btnWrapper);
    }

    wrapper.append(wrapperLabel, wrapperContent, spacer);
    output.obj = wrapper;

    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => [...new Array(u.max_form + 1).keys()].map(form => {
        if(excludeAllInput.checked && (u.stats[form].traits.length === SETTINGS.traits.length || (u.stats[form].traits.length === SETTINGS.traits.length - 1 && !u.stats[form].traits.includes("Metal")))) {
            return [false, false, false];
        }

        const soutput = [];
        const unitCpy = UnitData.dataToRecord(u);
        unitCpy.current_form = form;

        let formTraits = getUnitTraitTargets(u, unitCpy, true, false);
        soutput.push(/** @type {HTMLDivElement[]} */ ([...wrapperContent.querySelectorAll(".advanced-trait-selector-wrapper")])
                .every(w => w.classList.contains("inactive") || formTraits.includes(w.dataset.trait ?? "")));

        if(form < 2) {
            soutput.push(false, false);
            return soutput;
        }

        unitCpy.talents = u.talents.map(t => t.cap);
        formTraits = getUnitTraitTargets(u, unitCpy, true, false);
        soutput.push(/** @type {HTMLDivElement[]} */ ([...wrapperContent.querySelectorAll(".advanced-trait-selector-wrapper")])
                .every(w => w.classList.contains("inactive") || formTraits.includes(w.dataset.trait ?? "")));

        unitCpy.ultra_talents = u.ultra_talents.map(t => t.cap);
        formTraits = getUnitTraitTargets(u, unitCpy, true, false);
        soutput.push(/** @type {HTMLDivElement[]} */ ([...wrapperContent.querySelectorAll(".advanced-trait-selector-wrapper")])
                .every(w => w.classList.contains("inactive") || formTraits.includes(w.dataset.trait ?? "")));

        return soutput;
    });

    return output;
}

/**
 * Creates a search filter element.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => boolean[][] }} An object containing the created input, and a function which determines which forms of a unit meet the filter.
 */
export function createAbilityFilterInput() {
    const output = {};

    const wrapper = document.createElement("div");
    wrapper.classList.add("advanced-wrapper");

    const wrapperLabel = document.createElement("h4");
    wrapperLabel.textContent = "Abilities";

    const wrapperContent = document.createElement("div");
    wrapperContent.id = "advanced-ability-spacer";

    for(const group of SETTINGS.abilityGroupings) {
        const groupWrapper = document.createElement("div");
        groupWrapper.classList.add("advanced-ability-group");

        for(const ability of group) {
            const btn = document.createElement("img");
            btn.src = `./assets/img/ability/${ability}.png`;
            btn.dataset.ability = ability;
            btn.classList.add("advanced-ability-selector", "inactive");
            btn.title = ability.replaceAll("_", " ");

            btn.onclick = () => btn.classList.toggle("inactive");
            groupWrapper.appendChild(btn);
        }

        wrapperContent.appendChild(groupWrapper);
    }

    wrapper.append(wrapperLabel, wrapperContent);
    output.obj = wrapper;

    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => [...new Array(u.max_form + 1).keys()].map(form => {
        const output = [];
        const unitCpy = structuredClone(u);
        unitCpy.current_form = form;

        output.push(/** @type {HTMLDivElement[]} */ ([...wrapperContent.querySelectorAll(".advanced-ability-selector")])
            .every(w => w.classList.contains("inactive") || UnitData.hasAbility(unitCpy, w.dataset.ability ?? "", form)));

        if(form < 2) {
            output.push(false, false);
            return output;
        }

        unitCpy.talents.map(t => t.value = t.cap);
        output.push(/** @type {HTMLDivElement[]} */ ([...wrapperContent.querySelectorAll(".advanced-ability-selector")])
            .every(w => w.classList.contains("inactive") || UnitData.hasAbility(unitCpy, w.dataset.ability ?? "", form)));

        unitCpy.ultra_talents.map(t => t.value = t.cap);
        output.push(/** @type {HTMLDivElement[]} */ ([...wrapperContent.querySelectorAll(".advanced-ability-selector")])
            .every(w => w.classList.contains("inactive") || UnitData.hasAbility(unitCpy, w.dataset.ability ?? "", form)));

        return output;
    });
        
    return output;
}

/**
 * Creates a search filter element.
 * @param {HTMLInputElement} ownedCheckbox The checkbox that determines if all unit upgrades should be considered.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => boolean[][] }} An object containing the created input, and a function which determines which forms of a unit meet the filter.
 */
export function createStatFilterInput(ownedCheckbox) {
    const output = {};

    const wrapper = document.createElement("div");
    wrapper.classList.add("advanced-wrapper");

    const wrapperLabel = document.createElement("h4");
    wrapperLabel.textContent = "Stats";

    const useTraitsWrapper = document.createElement("div");
    useTraitsWrapper.classList.add("advaced-label-spacer");
    useTraitsWrapper.title = "Calculate damage as if unit is hitting their target traits";

    const useTraits = document.createElement("input");
    useTraits.type = "checkbox";
    useTraits.checked = true;
    useTraits.id = "advanced-use-traits";

    const useTraitsLabel = document.createElement("label");
    useTraitsLabel.textContent = "Traited Damage";

    useTraitsWrapper.append(useTraitsLabel, useTraits);

    const unitLevelSimWrapper = document.createElement("div");
    unitLevelSimWrapper.id = "advanced-level-box";
    unitLevelSimWrapper.classList.add("advaced-label-spacer");

    const unitLevelSimLabel = document.createElement("label");
    unitLevelSimLabel.textContent = "Set Level:";
    unitLevelSimLabel.id = "advanced-level-sim-label";
    unitLevelSimWrapper.appendChild(unitLevelSimLabel);

    const levelMap = [[CALCULATOR_LEVEL_OPTIONS.LEVEL_CURRENT, "Current"], [CALCULATOR_LEVEL_OPTIONS.LEVEL_1, "1"], [CALCULATOR_LEVEL_OPTIONS.LEVEL_30, "30"], [CALCULATOR_LEVEL_OPTIONS.LEVEL_50, "50"], [CALCULATOR_LEVEL_OPTIONS.LEVEL_MAX, "Max"]];
    for(const [data, str] of levelMap) {
        const btn = document.createElement("button");
        btn.classList.add("advanced-level-option");
        btn.classList.toggle("inactive", data !== CALCULATOR_LEVEL_OPTIONS.LEVEL_CURRENT);
        btn.textContent = `${str}`;
        btn.dataset.levelType = `${data}`;
        btn.onclick = () => {
            unitLevelSimWrapper.querySelectorAll(".advanced-level-option").forEach(b => b.classList.add("inactive"));
            btn.classList.remove("inactive");
        }

        unitLevelSimWrapper.appendChild(btn);
    }

    const wrapperContent = document.createElement("div");
    wrapperContent.id = "advanced-stats-spacer";

    const { obj: stat1, filterCallback: statCallback1 } = createSingleStatFilterInput("cost", "Cost", calculateCost, ownedCheckbox, useTraits);
    const { obj: stat2, filterCallback: statCallback2 } = createSingleStatFilterInput("health", "Health", calculateHealth, ownedCheckbox, useTraits);
    const { obj: stat3, filterCallback: statCallback3 } = createSingleStatFilterInput("damage", "Damage", calculateDamage, ownedCheckbox, useTraits);
    const { obj: stat4, filterCallback: statCallback4 } = createSingleStatFilterInput("knockbacks", "Knockbacks", calculateKnockbacks, ownedCheckbox, useTraits);
    const { obj: stat5, filterCallback: statCallback5 } = createSingleStatFilterInput("cooldown", "Recharge Time", calculateRechargeTime, ownedCheckbox, useTraits);
    const { obj: stat6, filterCallback: statCallback6 } = createSingleStatFilterInput("range", "Range", calculateRange, ownedCheckbox, useTraits);
    const { obj: stat7, filterCallback: statCallback7 } = createSingleStatFilterInput("speed", "Speed", calculateSpeed, ownedCheckbox, useTraits);

    wrapperContent.append(useTraitsWrapper, unitLevelSimWrapper, stat1, stat2, stat3, stat4, stat5, stat6, stat7);
    wrapper.append(wrapperLabel, wrapperContent);
    output.obj = wrapper;

    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => [...new Array(u.max_form + 1).keys()].map(form => {
        const output = [];
        const unitCpy = structuredClone(u);
        unitCpy.current_form = form;

        output.push(testAllStats(unitCpy, form, statCallback1, statCallback2, statCallback3, statCallback4, statCallback5, statCallback6, statCallback7));

        if(form < 2) {
            output.push(false, false);
            return output;
        }
        unitCpy.talents.map(t => t.value = t.cap);
        output.push(testAllStats(unitCpy, form, statCallback1, statCallback2, statCallback3, statCallback4, statCallback5, statCallback6, statCallback7));

        unitCpy.ultra_talents.map(t => t.value = t.cap);
        output.push(testAllStats(unitCpy, form, statCallback1, statCallback2, statCallback3, statCallback4, statCallback5, statCallback6, statCallback7));

        return output;
    });

    return output;
}

/**
 * Tests a unit for multiple testing functions at once.
 * @param {import("../../data/unit-data.js").UNIT_DATA} u The unit being tested.
 * @param {number} form The form of the unit to test.
 * @param  {...(u: import("../../data/unit-data.js").UNIT_DATA) => number[]} callbacks Functions that test the stats.
 * @returns {boolean} Whether the unit passed all tests.
 */
export function testAllStats(u, form, ...callbacks) {
    let flag = true;

    for(const callback of callbacks) {
        flag = flag && callback(u).includes(form);
    }

    return flag;
}

/**
 * Creates a stat filter input for a single stat.
 * @param {string} statName The name of the stat.
 * @param {string} displayName The name to display for the stat.
 * @param {(initialValue: number, updatedData: import("../../data/unit-data.js").UNIT_RECORD, fixedData: import("../../data/unit-data.js").UNIT_DATA, calculatorOptions: import("../../helper/calculate-stats.js").CALCULATOR_OPTIONS) => number} statCallback A function which, given the unit's base stats and properties, calculates the unit's damage.
 * @param {HTMLInputElement} ownedCheckbox The checkbox that determines if all unit upgrades should be considered.
 * @param {HTMLInputElement} useTraits A checkbox to determine if the stats should be based on the unit's target trait.
 * @returns {{obj: HTMLElement, filterCallback: (u: import("../../data/unit-data.js").UNIT_DATA) => number[] }} An object containing the created input, and a function which determines which forms of a unit meet the filter.
 */
export function createSingleStatFilterInput(statName, displayName, statCallback, ownedCheckbox, useTraits) {
    const output = {};

    const wrapper = document.createElement("div");
    wrapper.classList.add("advanced-single-stat-wrapper");

    const wrapperLabel = document.createElement("p");
    wrapperLabel.classList.add("advanced-stat-label");
    wrapperLabel.textContent = displayName;

    const minValue = document.createElement("input");
    minValue.type = "text";
    minValue.min = "0";
    minValue.max = "1000000000";
    minValue.placeholder = "0";
    minValue.oninput = () => {
        let str = minValue.value.replaceAll(/[^0-9.]+/g, "");
        const pos = str.indexOf(".");
        if(pos > 0) {
            str = str.slice(0, pos + 1) + str.slice(pos + 1).replaceAll(".", "");
        }
        minValue.value = str;
    }

    const maxValue = document.createElement("input");
    maxValue.type = "text";
    maxValue.min = "0";
    maxValue.max = "1000000000";
    maxValue.placeholder = "∞";
    maxValue.oninput = () => {
        let str = maxValue.value.replaceAll(/[^0-9.]+/g, "");
        const pos = str.indexOf(".");
        if(pos > 0) {
            str = str.slice(0, pos + 1) + str.slice(pos + 1).replaceAll(".", "");
        }
        maxValue.value = str;
    }

    wrapper.append(minValue, "≤", wrapperLabel, "≤", maxValue);

    output.obj = wrapper;
    output.filterCallback = (/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => {
        let modData = UnitData.dataToRecord(u);
        if(!ownedCheckbox.checked) {
            modData.talents = u.talents.map(t => t.cap);
            modData.ultra_talents = u.talents.map(ut => ut.cap);
        }

        // @ts-ignore
        const testLevelValue = parseInt(document.querySelector("#advanced-level-box .advanced-level-option:not(.inactive)").dataset.levelType ?? "0");
        return [...new Array(u.max_form + 1).keys()].filter(i => {
            modData.current_form = i;
            const calcStat = statCallback(u.stats[i][statName], modData, u, { 
                targetTraits: (useTraits ? SETTINGS.traits : []),
                targetSubTraits: (useTraits ? SETTINGS.subTraits : []),
                testLevelValue: testLevelValue,
                includeTalents: true,
                includeOrbs: true,
                eocChapterPrice: 2,
                talentIgnoreForm: false
            });

            return parseFloat(minValue.value || "0") <= calcStat && calcStat <= parseFloat(maxValue.value || "1000000000");
        });
    };

    return output;
}

/**
 * Creates a search filter element.
 * @returns {{obj: HTMLElement, filterCallback: (units: number[]) => number[] }} An object containing the created input, and a function which takes zero or more units and returns 10 randomly selected units, less if there are not enough to choose 10.
 */
export function createRandom10FilterInput() {
    const output = {};

    const input = document.createElement("input");
    input.id = "advanced-random10-filter";
    input.type = "checkbox";
    input.checked = false;

    const label = document.createElement("label");
    label.textContent = "Random 10";
    label.title = "Search results will only show (up to) 10 out of all units that met the search criteria"
    label.htmlFor = "advanced-random10-filter";

    output.obj = document.createElement("div");
    output.obj.classList.add("advaced-label-spacer");
    output.obj.append(label, input);

    output.filterCallback = (/** @type {number[]} */ units) => {
        if(!input.checked) {
            return units;
        }

        const res = [];

        for(let x = 0; x < 10 && units.length > 0; x++) {
            res.push(units.splice(Math.floor(Math.random() * units.length), 1)[0]);
        }

        return res;
    };

    return output;
}