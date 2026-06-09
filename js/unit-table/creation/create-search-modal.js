// @ts-check

import SETTINGS from "../../../assets/settings.js";
import { REQUEST_TYPES } from "../../communication/iframe-link.js";
import * as FilterInput from "./create-search-modal-filter.js";

let unitSelectCallback = null;

/**
 * Opens a created search modal.
 * @param {(u: import("../../data/unit-data.js").UNIT_DATA, form: number) => void} unitCallback A function to call for any unit selected from a search result.
 * @param {boolean|null} ownedOnly Whether the owned filter should always be on (true), off (false), or not restricted (null).
 */
export function openSearchModal(unitCallback, ownedOnly = null) {
    unitSelectCallback = unitCallback;
    const actualOwnedCheckbox = /** @type {HTMLInputElement} */ (document.querySelector("#advanced-owned-wrapper input"));
    actualOwnedCheckbox.disabled = ownedOnly !== null;
    if(ownedOnly !== null) {
        actualOwnedCheckbox.checked = ownedOnly;
        actualOwnedCheckbox.parentElement?.classList.add("hidden");
    }

    const container = /** @type {HTMLDivElement} */ (document.querySelector("#advanced-results-content"));
    container.innerHTML = "";

    document.querySelector("#advanced-search-modal-wrapper")?.classList.remove("hidden");
}

const rarityMap = { N: "Normal", EX: "Special", RR: "Rare", SR: "Super Rare", UR: "Uber Rare", LR: "Legend Rare" };
/**
 * Creates a modal that allows for more precise unit searching.
 * @returns {HTMLDivElement} The search modal.
 */
export default function createSearchModal() {
    const output = document.createElement("div");
    output.classList.add("hidden");
    output.id = "advanced-search-modal-wrapper";
    
    const closeX = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    closeX.id = "advanced-search-exit";
    closeX.setAttribute("viewBox", "-5 -5 74 74");
    closeX.innerHTML = '<path d="M10 0 0 10 22 32 0 54 10 64 32 42 54 64 64 54 42 32 64 10 54 0 32 22Z" />';
    closeX.onclick = () => output.classList.add("hidden");
    output.appendChild(closeX);

    output.addEventListener("click", ev => {
        if(ev.target === output) closeX.dispatchEvent(new Event("click"));
    });

    const content = document.createElement("div");
    content.id = "advanced-search-modal";

    const searchOptions = document.createElement("div");
    searchOptions.id = "advanced-search-options";

    const optionLabel = document.createElement("h2");
    optionLabel.id = "advanced-search-label";
    optionLabel.textContent = "Advanced Search";

    const { obj: nameInput, filterCallback: filterName } = FilterInput.createNameFilterInput();
    const { obj: ownedCheckbox, filterCallback: filterOwnedOnly } = FilterInput.createOwnedFilterInput();
    const {obj: raritySelection, filterCallback: filterRarity } = FilterInput.createRarityFilterInput();
    const { obj: traitSelection, filterCallback: filterTargetTraits } = FilterInput.createTargetTraitFilterInput();
    const { obj: abilityMultibox, filterCallback: filterAbilities } = FilterInput.createAbilityFilterInput();
    const actualOwnedCheckbox = /** @type {HTMLInputElement} */ (ownedCheckbox.querySelector("input"));
    const { obj: statMultiRange, filterCallback: filterStatRange } = FilterInput.createStatFilterInput(actualOwnedCheckbox);
    const { obj: randomToggle, filterCallback: filterRandom10 } = FilterInput.createRandom10FilterInput();

    const searchButton = document.createElement("button");
    searchButton.id = "advanced-search-enter";
    searchButton.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a8 8 0 105.29 14.29l5.21 5.21 1.5-1.5-5.21-5.21A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/>
    </svg>`;
    searchButton.onclick = () => applySearch((/** @type {import("../../data/unit-data.js").UNIT_DATA} */ u) => {
        const datalist = /** @type {HTMLDivElement} */ (document.querySelector("#search-suggestion-dropdown"));

        let nullCount = 0;
        const units = [...new Array(u.max_form + 1).keys()].map(i => {
            const unitOutput = [false, false, false];

            let sharedFilter = filterOwnedOnly(u) && filterRarity(u) && filterName(u).includes(i);
            
            const targetSearchField = datalist.querySelector(`div[data-target='${u.id}'][data-form='${i}']`);
            sharedFilter = sharedFilter && targetSearchField !== null && !targetSearchField.classList.contains("global-hidden");

            const formTraits = filterTargetTraits(u);
            const formAbilities = filterAbilities(u);
            const formStats = filterStatRange(u);

            unitOutput[0] = sharedFilter && formTraits[i][0] && formAbilities[i][0] && formStats[i][0];
            unitOutput[1] = !actualOwnedCheckbox.checked && sharedFilter && formTraits[i][1] && formAbilities[i][1] && formStats[i][1];
            unitOutput[2] = !actualOwnedCheckbox.checked && sharedFilter && formTraits[i][2] && formAbilities[i][2] && formStats[i][2];
            if(!(unitOutput[0] || unitOutput[1] || unitOutput[2])) {
                nullCount++;
                return null;
            }
            return unitOutput;
        });

        if(nullCount === units.length) {
            return null;
        }

        return units;
    }, filterRandom10);

    const searchButtonText = document.createElement("p");
    searchButtonText.textContent = "Search";
    searchButton.prepend(searchButtonText);

    const nameSearchAlign = document.createElement("div");
    nameSearchAlign.id = "advanced-search-name-align";

    nameSearchAlign.append(nameInput, ownedCheckbox, searchButton);

    const otherWrapper = document.createElement("div");
    otherWrapper.classList.add("advanced-wrapper");

    const wrapperLabel = document.createElement("h4");
    wrapperLabel.textContent = "Other";

    const wrapperContents = document.createElement("div");
    wrapperContents.id = "advanced-other-spacer";

    wrapperContents.appendChild(randomToggle);
    otherWrapper.append(wrapperLabel, wrapperContents);

    const resetButton = document.createElement("button");
    resetButton.onclick = resetAllFilters;
    resetButton.textContent = "Reset Filters";

    searchOptions.append(optionLabel, nameSearchAlign, resetButton, raritySelection, traitSelection, abilityMultibox, statMultiRange, otherWrapper);

    const results = createResults();

    content.append(searchOptions, results);
    output.appendChild(content);
    return output;
}

/**
 * 
 * @param {(u: import("../../data/unit-data.js").UNIT_DATA) => (boolean[]|null)[]|null} searchCallback A function which returns only the forms of the provided unit which met the search criteria.
 * @param {(units: number[]) => number[]} resultFilter A function which filters the search results.
 */
async function applySearch(searchCallback, resultFilter) {
    const container = /** @type {HTMLDivElement} */ (document.querySelector("#advanced-results-content"));
    container.innerHTML = '<p id="search-loading-msg">Loading...</p>';
    
    const data = await REQUEST_TYPES.GET_ALL_DATA(true);
    const res = {};

    for(const u of data) {
        const forms = searchCallback(u);
        if(forms) {
            res[u.id] = {
                forms: forms,
                data: u
            };
        }
    }

    const resFilter = resultFilter(Object.keys(res).map(k => parseInt(k)));
    const filteredRes = Object.fromEntries(resFilter.map(k => [k, res[k]]));
    displayResults(container, filteredRes);
}

/**
 * Creates the results side of the advanced search modal.
 * @returns {HTMLDivElement} An element that can display search results.
 */
function createResults() {
    const results = document.createElement("div");
    results.id = "advanced-search-results";

    const resultLabel = document.createElement("h3");
    resultLabel.id = "advanced-results-label";
    resultLabel.textContent = "Results";

    const input = document.createElement("input");
    input.id = "advanced-result-minify";
    input.type = "checkbox";
    input.checked = false;
    input.onchange = () => resultsContent.classList.toggle("advanced-simple-result", input.checked);

    const label = document.createElement("label");
    label.textContent = "Simple Results";
    label.title = "Search results will only show the unit icon"
    label.htmlFor = "advanced-result-minify";

    const resultMinInfoWrapper = document.createElement("div");
    resultMinInfoWrapper.classList.add("advaced-label-spacer");
    resultMinInfoWrapper.append(label, input);

    const resultsContent = document.createElement("div");
    resultsContent.id = "advanced-results-content";

    results.append(resultLabel, resultMinInfoWrapper, resultsContent);
    return results;
}

/**
 * Displays the results of a search.
 * @param {HTMLDivElement} container A container to put the results in.
 * @param {object} results An object that maps unit ids to the rest of their data and the forms which met the search criteria.
 */
function displayResults(container, results) {
    container.innerHTML = "";

    for(const key of Object.keys(results).sort((a, b) => parseInt(a) - parseInt(b))) {
        const result = document.createElement("div");
        result.classList.add(`${rarityMap[results[key].data.rarity].toLowerCase().replaceAll(" ", "-")}-color`);
        result.classList.add("advanced-result-wrapper");

        const iconWrapper = document.createElement("div");
        iconWrapper.classList.add("advanced-icon-centering");

        const icon = document.createElement("img");
        const maxValidForm = results[key].forms.findLastIndex(x => x !== null);
        const validImage = SETTINGS.skipImages.includes(parseInt(key));
        if(!validImage) {
            icon.src = `./assets/img/unit_icon/${key}_${maxValidForm}.png`;
        } else {
            icon.src = `./assets/img/unit_icon/unknown.png`;
        }
        icon.title = [results[key].data.normal_form, results[key].data.evolved_form, results[key].data.true_form, results[key].data.ultra_form][maxValidForm];
        icon.dataset.form = `${maxValidForm}`;
        iconWrapper.appendChild(icon);
        icon.onclick = () => {
            document.querySelector("#advanced-search-modal-wrapper")?.classList.add("hidden");
            unitSelectCallback(results[key].data, parseInt(icon.dataset.form ?? "0"));
        }

        const id = document.createElement("p");
        id.classList.add("advanced-result-id");
        id.textContent = key;

        const hAlign = document.createElement("div");
        hAlign.classList.add("advanced-result-details");

        const talentReq = document.createElement("div");
        talentReq.classList.add("advanced-talent-required");
        talentReq.title = "Whether the unit needs talents unlocked to meet the search criteria"

        const npImg = document.createElement("img");
        npImg.classList.add("advanced-np-img");
        npImg.src = "./assets/img/evo_mats/np_token.png";
        talentReq.appendChild(npImg);

        const utReq = document.createElement("div");
        utReq.classList.add("advanced-ut-required");
        utReq.title = "Whether the unit needs ultra talents unlocked to meet the search criteria"

        const npImg2 = document.createElement("img");
        npImg2.classList.add("advanced-np-img");
        npImg2.src = "./assets/img/evo_mats/np_token.png";

        const darkImg = document.createElement("img");
        darkImg.classList.add("advanced-dark-img");
        darkImg.src = "./assets/img/evo_mats/dark_catseye.png";

        talentReq.classList.toggle("advanced-resource", !(!results[key].forms[maxValidForm][0] && results[key].forms[maxValidForm][1]));
        utReq.classList.toggle("advanced-resource", !(!results[key].forms[maxValidForm][0] && !results[key].forms[maxValidForm][1]));
        utReq.append(darkImg, npImg2);
        hAlign.append(talentReq, utReq);

        for(let x = 0; x < 4; x++) {
            const formBtn = document.createElement("div");
            formBtn.classList.add("advanced-form-option");
            formBtn.classList.add(`advanced-form-${x}`);
            if(results[key].forms[x]) {
                formBtn.innerHTML = ["N", "E", "T", "U"][x];
                formBtn.title = `(${["Normal Form", "Evolved Form", "True Form", "Ultra Form"][x]}) - These letters represent the unit's forms. A letter is only shown for forms which match`
                formBtn.classList.add("advanced-clickable");
                formBtn.onclick = () => {
                    if(!validImage) {
                        icon.src = `./assets/img/unit_icon/${key}_${x}.png`;
                    } else {
                        icon.src = `./assets/img/unit_icon/unknown.png`;
                    }
                    icon.title = [results[key].data.normal_form, results[key].data.evolved_form, results[key].data.true_form, results[key].data.ultra_form][x];
                    icon.dataset.form = `${x}`;

                    talentReq.classList.toggle("advanced-resource", !(!results[key].forms[x][0] && results[key].forms[x][1]));
                    utReq.classList.toggle("advanced-resource", !(!results[key].forms[x][0] && !results[key].forms[x][1]));
                };
            }
            hAlign.appendChild(formBtn);
        }
        
        result.append(id, iconWrapper, hAlign);

        container.appendChild(result);
    }
}

/**
 * Sets all search filters to their default state, except for checkboxes.
 */
function resetAllFilters() {
    document.querySelectorAll("#advanced-rarity-spacer .advanced-rarity-selector").forEach(i => i.classList.add("inactive"));
    document.querySelectorAll("#advanced-trait-spacer .advanced-trait-selector-wrapper").forEach(i => i.classList.add("inactive"));
    document.querySelectorAll("#advanced-ability-spacer .advanced-ability-selector").forEach(i => i.classList.add("inactive"));
    /** @type {NodeListOf<HTMLInputElement>} */ (document.querySelectorAll("#advanced-stats-spacer input[type='text']")).forEach(i => i.value = "");
    /** @type {HTMLButtonElement} */ (document.querySelector("#advanced-level-box .advanced-level-option[data-level-type='0']")).click();

    /** @type {HTMLDivElement} */ (document.querySelector("#advanced-results-content")).innerHTML = "";
}