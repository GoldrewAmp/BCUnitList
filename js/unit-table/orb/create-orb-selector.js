//@ts-check
import * as orbData from "../../../assets/orb-map.js";
const ORB_DATA = orbData.default;

/**
 * Creates a modal for selecting the components of an orb.
 * @returns {HTMLDivElement} The created orb modal.
 */
export default function createOrbMenu() {
    const modalBG = document.createElement("div");
    modalBG.id = "orb-selection-modal";
    modalBG.classList.add("modal-bg");
    modalBG.classList.add("hidden");

    const content = document.createElement("div");
    content.classList.add("modal-fill");

    const exit = document.createElement("div");
    exit.id = "orb-selection-cancel";
    exit.classList.add("modal-close");

    modalBG.addEventListener("click", ev => {
        if(ev.target === modalBG) exit.dispatchEvent(new Event("click"));
    });
    
    const closeX = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    closeX.setAttribute("viewBox", "0 0 64 64");
    closeX.innerHTML = '<polygon points="10,0 0,10 54,64 64,54" /><polygon points="54,0 64,10 10,64 0,54" />';

    exit.appendChild(closeX);

    const label = document.createElement("h2");
    label.textContent = "Talent Orb Selection";

    const confirmCentering = document.createElement("div");
    confirmCentering.id = "orb-option-centering";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.id = "remove-orb";
    removeButton.textContent = "Remove Orb";

    const resultDisplay = document.createElement("div");
    resultDisplay.classList.add("orb-selector");
    resultDisplay.id = "orb-result";

    const colorImg = document.createElement("img");
    colorImg.classList.add("orb-color");
    const typeImg = document.createElement("img");
    typeImg.classList.add("orb-type");
    const rankImg = document.createElement("img");
    rankImg.classList.add("orb-rank");

    resultDisplay.append(colorImg, typeImg, rankImg);

    const attachButton = document.createElement("button");
    attachButton.type = "button";
    attachButton.id = "attach-orb";
    attachButton.textContent = "Attach Orb";

    confirmCentering.append(removeButton, resultDisplay, attachButton);

    const effectSeries = createEffectSubmenu();
    const abilitySeries = createAbilitySubmenu();
    abilitySeries.classList.add("hidden");
    const seriesToggle = createSeriesSelector(resultDisplay, effectSeries, abilitySeries);

    content.append(seriesToggle, label, effectSeries, abilitySeries, confirmCentering);
    modalBG.append(content, exit);

    return modalBG;
}

/**
 * Checks if all of the components of an orb have been selected, and enables/disables the button for attaching the orb to the unit if they have.
 */
function updateAttachButton() {
    const attachOrb = /** @type {HTMLButtonElement} */ (document.querySelector("#attach-orb"));
    const resultOrb = /** @type {HTMLDivElement} */ (document.querySelector("#orb-result"));
    const resultOrbColor = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-color"));
    const resultOrbType = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-type"));
    const resultOrbRank = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-rank"));


    if(resultOrbColor.dataset.trait && resultOrbType.dataset.type && resultOrbRank.dataset.rank) {
        attachOrb.disabled = false;
    }
}

/**
 * Creates an element for selecting from all orb traits.
 * @returns {HTMLDivElement} The created element.
 */
function createTraitSelectionSubmenu() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("trait-selection");
    const traitOptions = [];

    for(let x = 0; x < ORB_DATA.traits.length; x++) {
        const trait = createTraitSelector(x, ORB_DATA.traits[x]);
        traitOptions.push(trait);
        wrapper.appendChild(trait);
        trait.onclick = () => {
            traitOptions.forEach(v => v.classList.remove("orb-selected"));
            trait.classList.add("orb-selected");
            
            const resultOrb = /** @type {HTMLDivElement} */ (document.querySelector("#orb-result"));
            const resultOrbColor = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-color"));
            resultOrbColor.src = trait.querySelector("img")?.src ?? "";
            resultOrbColor.dataset.trait = trait.dataset.trait;
            updateAttachButton();
        }
    }

    return wrapper;
}

/**
 * Creates an element for selecting an orb trait.
 * @param {number} traitID The ID of the trait based on its order in assets/orb-map.js
 * @param {string} traitTitle The string representation of the trait in assets/orb-map.js
 * @returns {HTMLDivElement} The created element.
 */
function createTraitSelector(traitID, traitTitle) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-selector");
    wrapper.dataset.trait = `${traitID}`;

    const title = document.createElement("h4");
    title.textContent = traitTitle;

    const traitImg = document.createElement("img");
    traitImg.src = `./assets/img/orb/trait/${traitID}.png`;
    traitImg.title = traitTitle;

    wrapper.append(title, traitImg);
    return wrapper;
}

/**
 * Creates an element for choosing from all orb types.
 * @returns {HTMLDivElement} The created element.
 */
function createTypeSelectionSubmenu() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("type-selection");
    const typeOptions = [];

    for(let x = 0; x < ORB_DATA.types.length; x++) {
        const type = createTypeSelector(x, ORB_DATA.types[x]);
        typeOptions.push(type);
        wrapper.appendChild(type);
        type.onclick = () => {
            typeOptions.forEach(v => v.classList.remove("orb-selected"));
            type.classList.add("orb-selected");

            const resultOrb = /** @type {HTMLDivElement} */ (document.querySelector("#orb-result"));
            const resultOrbType = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-type"));
            resultOrbType.src = type.querySelector("img")?.src ?? "";
            resultOrbType.classList.remove("invisible");
            resultOrbType.dataset.type = type.dataset.type;
            updateAttachButton();
        }
    }

    return wrapper;
}

/**
 * Creates an element for selecting an orb type.
 * @param {number} typeID The ID of the type based on its order in assets/orb-map.js
 * @param {string} typeTitle The string representation of the type in assets/orb-map.js
 * @returns {HTMLDivElement} The created element.
 */
function createTypeSelector(typeID, typeTitle) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-selector");
    wrapper.dataset.type = `${typeID}`;

    const title = document.createElement("h4");
    title.textContent = typeTitle;

    const typeImgWrapper = document.createElement("div");
    typeImgWrapper.classList.add("type-shrinkwrap");

    const typeImg = document.createElement("img");
    typeImg.src = `./assets/img/orb/type/${typeID}.png`;
    typeImg.title = typeTitle;

    typeImgWrapper.appendChild(typeImg);

    wrapper.append(title, typeImgWrapper);
    return wrapper;
}

/**
 * Creates an element for selecting any orb rank.
 * @returns {HTMLDivElement} An element containing each rank.
 */
function createRankSelectionSubmenu() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("rank-selection");
    const rankOptions = [];

    for(let x = 0; x < ORB_DATA.ranks.length; x++) {
        const rank = createRankSelector(x, ORB_DATA.ranks[x]);
        const rankImg = /** @type {HTMLImageElement} */ (rank.querySelector("img"));
        rankOptions.push(rank);
        wrapper.appendChild(rank);

        rank.onclick = () => {
            rankOptions.forEach(v => v.classList.remove("orb-selected"));
            rank.classList.add("orb-selected");

            const resultOrb = /** @type {HTMLDivElement} */ (document.querySelector("#orb-result"));
            const resultOrbRank = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-rank"));
            resultOrbRank.src = rank.querySelector("img")?.src ?? "";
            resultOrbRank.classList.remove("invisible");
            resultOrbRank.dataset.rank = rankImg.dataset.rank;
            updateAttachButton();
        }
    }

    return wrapper;
}

/**
 * Creates an element for selecting an orb rank.
 * @param {number} imgID The ID of the rank based on its order in assets/orb-map.js
 * @param {string} imgTitle The string representation of the rank in assets/orb-map.js
 * @returns {HTMLDivElement} An element representing a single rank.
 */
function createRankSelector(imgID, imgTitle) {
    const superWrapper = document.createElement("div");
    superWrapper.classList.add("rank-shrinkwrap");

    const wrapper = document.createElement("div");
    const img = document.createElement("img");

    img.src = `./assets/img/orb/rank/${imgID}.png`;
    img.dataset.rank = `${imgID}`;
    img.title = imgTitle;

    wrapper.appendChild(img);
    superWrapper.appendChild(wrapper);

    return superWrapper;
}

function createAbilitySelectionSubmenu() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("ability-selection");
    const abilityOptions = [];

    for(let x = 0; x < ORB_DATA.abilities.length; x++) {
        const ability = createAbilitySelector(x, ORB_DATA.abilities[x]);
        abilityOptions.push(ability);
        wrapper.appendChild(ability);
        ability.onclick = () => {
            abilityOptions.forEach(v => v.classList.remove("orb-selected"));
            ability.classList.add("orb-selected");

            const resultOrb = /** @type {HTMLDivElement} */ (document.querySelector("#orb-result"));
            const resultOrbType = /** @type {HTMLImageElement} */ (resultOrb.querySelector(".orb-type"));
            resultOrbType.src = ability.querySelector("img")?.src ?? "";
            resultOrbType.classList.remove("invisible");
            resultOrbType.dataset.type = ability.dataset.type;
            updateAttachButton();
        }
    }

    return wrapper;
}

/**
 * Creates an element for selecting an orb ability.
 * @param {number} imgID The ID of the ability based on its order in assets/orb-map.js
 * @param {string} imgTitle The string representation of the ability in assets/orb-map.js
 * @returns {HTMLDivElement} An element representing a single ability.
 */
function createAbilitySelector(imgID, imgTitle) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-selector");
    wrapper.dataset.type = `${imgID}`;

    const title = document.createElement("h4");
    title.textContent = imgTitle;

    const abilityImgWrapper = document.createElement("div");
    abilityImgWrapper.classList.add("ability-shrinkwrap");

    const abilityImg = document.createElement("img");
    abilityImg.src = `./assets/img/orb/ability/${imgID}.png`;
    abilityImg.title = imgTitle;

    abilityImgWrapper.appendChild(abilityImg);

    wrapper.append(title, abilityImgWrapper);
    return wrapper;
}

/**
 * Creates a selector for switching between different types of orbs (called series to differentiate from type being used for the orb's ability target)
 * @param {HTMLDivElement} orbDisplay An element containing the elements which represent the final orb being created.
 * @param {HTMLElement} effectUI The UI for selecting effect orbs.
 * @param {HTMLElement} abilityUI The UI for selecting ability orbs.
 * @returns {HTMLDivElement} An element containing the selector.
 */
function createSeriesSelector(orbDisplay, effectUI, abilityUI) {
    const seriesToggle = document.createElement("div");
    seriesToggle.id = "orb-series-toggle";
    seriesToggle.classList.add("v-align");

    const seriesCaption = document.createElement("h4");
    seriesCaption.id = "series-caption";
    seriesCaption.textContent = "Select Orb Type";

    const seriesOptionWrapper = document.createElement("div");
    seriesOptionWrapper.id = "orb-series-wrapper";
    seriesOptionWrapper.classList.add("h-align");

    const toggleEffect = document.createElement("button");
    toggleEffect.id = "effect-toggle";
    toggleEffect.title = "Trait-based orbs";
    toggleEffect.textContent = "Effect";
    toggleEffect.onclick = () => {
        abilityUI.classList.add("hidden");
        if(effectUI.classList.contains("hidden")) {
            resetOrb(orbDisplay);
        }
        effectUI.classList.remove("hidden");
        window.localStorage.setItem("tss", "e");
    };

    const toggleAbility = document.createElement("button");
    toggleAbility.id = "ability-toggle";
    toggleAbility.title = "Ability-based orbs";
    toggleAbility.textContent = "Ability";
    toggleAbility.onclick = () => {
        effectUI.classList.add("hidden");
        if(abilityUI.classList.contains("hidden")) {
            resetOrb(orbDisplay);
        }
        const color = /** @type {HTMLImageElement} */ (orbDisplay.querySelector(".orb-color"));
        color.src = "./assets/img/orb/trait/99.png";
        color.dataset.trait = "99";
        abilityUI.classList.remove("hidden");
        window.localStorage.setItem("tss", "a");
    };

    seriesOptionWrapper.append(toggleEffect, toggleAbility);
    seriesToggle.append(seriesCaption, seriesOptionWrapper);

    return seriesToggle;
}

/**
 * Creates the UI for selecting an effect orb.
 * @returns {HTMLDivElement} An element containing the submenu for selecting an effect orb.
 */
function createEffectSubmenu() {
    const wrapper = document.createElement("div");
    wrapper.id = "effect-submenu";

    const traitLabel = document.createElement("h3");
    traitLabel.textContent = "Orb Target Trait";
    const typeLabel = document.createElement("h3");
    typeLabel.textContent = "Orb Type";
    const rankLabel = document.createElement("h3");
    rankLabel.textContent = "Orb Rank";

    wrapper.append(traitLabel, createTraitSelectionSubmenu(), typeLabel, createTypeSelectionSubmenu(), rankLabel, createRankSelectionSubmenu());

    return wrapper;
}

/**
 * Creates the UI for selecting an ability orb.
 * @returns {HTMLDivElement} An element containing the submenu for selecting an ability orb.
 */
function createAbilitySubmenu() {
    const wrapper = document.createElement("div");
    wrapper.id = "ability-submenu";

    const abilityLabel = document.createElement("h3");
    abilityLabel.textContent = "Orb Ability";
    const rankLabel = document.createElement("h3");
    rankLabel.textContent = "Orb Rank";
    
    wrapper.append(abilityLabel, createAbilitySelectionSubmenu(), rankLabel, createRankSelectionSubmenu());

    return wrapper;
}

/**
 * Removes all selected orb properties from the current orb, and clears any selected orb properties from the orb menu.
 * @param {HTMLDivElement} orbDisplay An element containing the display of the orb and selected orb properties.
 */
function resetOrb(orbDisplay) {
    const color = /** @type {HTMLImageElement} */ (orbDisplay.querySelector(".orb-color"));
    const type = /** @type {HTMLImageElement} */ (orbDisplay.querySelector(".orb-type"));
    const rank = /** @type {HTMLImageElement} */ (orbDisplay.querySelector(".orb-rank"));

    color.src = "./assets/img/orb/empty-orb.png";
    color.dataset.trait = "";
    type.src = "";
    type.dataset.type = "";
    type.classList.add("invisible");
    rank.src = "";
    rank.dataset.rank = "";
    rank.classList.add("invisible");

    document.querySelectorAll("#orb-selection-modal .orb-selected").forEach(v => v.classList.remove("orb-selected"));

    const attachOrb = /** @type {HTMLButtonElement} */ (document.querySelector("#attach-orb"));
    attachOrb.disabled = true;
}