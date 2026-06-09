//@ts-check
import { FORM } from "../../data/unit-data.js";
import { createLevelInteractable, createOrbInteractable, createTalentInteractable } from "./create-row-interactable.js";
import SETTINGS from "../../../assets/settings.js";
import createStatRow from "./create-stat-row.js";
import { getActiveCallbacks } from "../filter-units.js";

/**
 * Creates a row in a unit table.
 * @param {import("../../data/unit-data.js").UNIT_DATA} entry The unit to take values from to initialize the row with.
 * @returns {HTMLTableRowElement} The created row.
 */
export default function createRow(entry) {
    const row = document.createElement("tr");
    row.classList.add("unit-mod-row");
    row.dataset.is_collab = entry.collab ? "Y" : "N";
    row.dataset.in_en = entry.in_EN ? "Y" : "N";
    row.dataset.is_unobtainable = entry.unobtainable ? "Y" : "N";
    row.dataset.rarity = entry.rarity;
    row.classList.toggle("hidden", entry.hidden);

    const idBox = createIDBox(entry.id);
    const [nameBox, nameUpdate] = createNameBox([entry.normal_form, entry.evolved_form, entry.true_form, entry.ultra_form], entry.current_form);
    const iconBox = createIconBox(entry.id, entry.current_form, entry.max_form, SETTINGS.skipImages.includes(entry.id), nameUpdate);
    const levelBox = createLevelBox(entry.id, entry.level_cap, entry.level, entry.plus_level);
    const talentBox = createTalentBox(entry.talents, entry.ultra_talents);
    const orbBox = createOrbBox(entry.orb);
    const favoriteBox = createFavoriteBox(entry.favorited);

    let statRow = null;
    let unobserveCallback = null;
    const optionsBox = createOptionsBox(_this => {
        if(_this.classList.contains("displaying")) {
            _this.classList.remove("displaying");
            unobserveCallback?.();
            statRow?.remove();
            statRow = null;
        } else {
            _this.classList.add("displaying");
            unobserveCallback = null;     
            const res = createStatRow(entry, row);
            statRow = res.row;
            unobserveCallback = res.callback;

            row.insertAdjacentElement("afterend", statRow);
        }
    }, _this => {
        const updateCallbacks = getActiveCallbacks();
        for(const key of Object.keys(updateCallbacks)) {
            updateCallbacks[key](row);
        }

        if("hide" in updateCallbacks && statRow !== null) {
            _this.classList.remove("displaying");
            unobserveCallback?.();
            statRow?.remove();
            statRow = null;
        }
    });

    row.append(idBox, iconBox, nameBox, levelBox, talentBox, orbBox, favoriteBox, optionsBox);
    return row;
}

/**
 * Creates a unit ID column entry.
 * @param {number} id The unit ID.
 * @returns {HTMLTableCellElement} The ID column entry.
 */
export function createIDBox(id) {
    const rowID = document.createElement("td");
    rowID.classList.add("row-id");
    rowID.textContent = `${id}`;

    return rowID;
}

/**
 * Creates a unit icon column entry.
 * @param {number} id The unit's id.
 * @param {FORM} currentForm The current form of the unit.
 * @param {FORM} maxForm The maximum allowed form of the unit.
 * @param {boolean} iconDisabled Whether the unit should display an icon.
 * @param {(form: FORM) => void} nameCallback A function to update the unit name column entry.
 * @returns {HTMLTableCellElement} The icon column entry.
 */
export function createIconBox(id, currentForm, maxForm, iconDisabled, nameCallback) {
    const rowImage = document.createElement("td");
    rowImage.classList.add("row-image");
    rowImage.dataset.form = `${currentForm}`;
    rowImage.dataset.max_form = `${maxForm}`;

    const rowIMG = document.createElement("img");
    rowIMG.classList.add("unit-icon", "clickable");
    rowIMG.loading = "lazy";

    if(iconDisabled) {
        rowIMG.src = "./assets/img/unit_icon/unknown.png";
    } else {
        rowIMG.src = `./assets/img/unit_icon/${id}_${currentForm}.png`;
        rowIMG.addEventListener("click", () => {
            if(rowImage.dataset.form === `${maxForm}`) {
                rowImage.dataset.form = "0";
            } else {
                rowImage.dataset.form = `${parseInt(rowImage.dataset.form ?? "-1") + 1}`;
            }
    
            if(!rowIMG.classList.contains("hidden")) {
                rowIMG.src = `./assets/img/unit_icon/${id}_${rowImage.dataset.form}.png`;
            }
            nameCallback(parseInt(rowImage.dataset.form));
        });
    }

    rowImage.appendChild(rowIMG);
    return rowImage;
}

/**
 * Creates a name column entry.
 * @param {[string|null, string|null, string|null, string|null]} names Names for all possible forms. If the unit does not have a specific form, the value should be null instead.
 * @param {FORM} currentForm The current form of the unit.
 * @returns {[HTMLTableCellElement, () => void]} The name column entry, and a function to set the unit to a specific form.
 */
export function createNameBox(names, currentForm) {
    const rowName = document.createElement("td");
    rowName.classList.add("row-name");
    rowName.dataset.normal_name = names[0] ?? "";
    rowName.dataset.evolved_name = names[1] ?? "";
    rowName.dataset.true_name = names[2] ?? "";
    rowName.dataset.ultra_name = names[3] ?? "";
    rowName.textContent = names[currentForm];

    return [rowName, (/** @type {number} */ form) => rowName.textContent = names[form]];
}

/**
 * Creates a level column entry.
 * @param {number} id The unit's id.
 * @param {import("../../data/unit-data.js").LEVEL_CAP} levelCapInfo The level caps to apply to the level and plus level inputs.
 * @param {number} currentLevel The initial value of the level input.
 * @param {number} currentPlusLevel  The initial value of the plus level input.
 * @returns {HTMLTableCellElement} The level column entry.
 */
export function createLevelBox(id, levelCapInfo, currentLevel, currentPlusLevel) {
    const rowLevel = document.createElement("td");
    rowLevel.classList.add("row-level");
    const horizontalAlign = document.createElement("span");
    horizontalAlign.classList.add("h-align");

    const maxLevel = createLevelInteractable(levelCapInfo.MaxLevel, currentLevel);
    horizontalAlign.appendChild(maxLevel);
    const maxLevelInput = /** @type {HTMLInputElement} */ (maxLevel.querySelector(".level-select") ?? maxLevel);
    maxLevelInput.classList.add("max-level");

    if(id === 0) {
        maxLevelInput.min = "1";
    }

    if(levelCapInfo.MaxPlusLevel > 0) {
        const plusText = document.createElement("p");
        plusText.classList.add("level-text");
        plusText.innerText = "+";
        horizontalAlign.appendChild(plusText);

        const maxPlusLevel = createLevelInteractable(levelCapInfo.MaxPlusLevel, currentPlusLevel);
        horizontalAlign.appendChild(maxPlusLevel);
        const maxPlusLevelInput = /** @type {HTMLInputElement} */ (maxPlusLevel.querySelector(".level-select") ?? maxPlusLevel);
        maxPlusLevelInput.classList.add("max-plus-level");
    }

    rowLevel.appendChild(horizontalAlign);
    return rowLevel;
}

/**
 * Creates a talent and ultra talent column entrty.
 * @param {import("../../data/unit-data.js").TALENT[]} normalTalents The normal talents of the unit.
 * @param {import("../../data/unit-data.js").TALENT[]} ultraTalents The ultra talents of the unit.
 * @returns {HTMLTableCellElement} The column entry.
 */
export function createTalentBox(normalTalents, ultraTalents) {
    const rowTalents = document.createElement("td");
    rowTalents.classList.add("row-talent");
    const horizontalAlign = document.createElement("div");
    horizontalAlign.classList.add("h-align");

    if(normalTalents.length !== 0) {
        for(const talent of normalTalents) {
            horizontalAlign.appendChild(createTalentInteractable(talent.name, talent.cap, talent.value, false));
        }
    }

    if(ultraTalents.length !== 0) {
        for(const talent of ultraTalents) {
            horizontalAlign.appendChild(createTalentInteractable(talent.name, talent.cap, talent.value, true));
        }
    }

    rowTalents.appendChild(horizontalAlign);
    return rowTalents;
}

/**
 * Creates an orb selection column entry.
 * @param {import("../../data/unit-data.js").ORB[]} existingOrbs Any existing orbs for the unit, being null if the unit does not have an orb in that slot.
 * @returns {HTMLTableCellElement} The column entry.
 */
export function createOrbBox(existingOrbs) {
    const rowOrb = document.createElement("td");
    rowOrb.classList.add("row-orb");
    let horizontalAlign = null;

    if(existingOrbs.length > 0) {
        horizontalAlign = document.createElement("div");
        horizontalAlign.classList.add("h-align");
        for(let x = 0; x < existingOrbs.length; x++) {
            horizontalAlign.appendChild(createOrbInteractable(existingOrbs[x]));
        }

        rowOrb.appendChild(horizontalAlign);
    }

    return rowOrb;
}

/**
 * Creates a favorite selection column entry.
 * @param {boolean} isFavorited Whether the unit should start off favorited.
 * @returns {HTMLTableCellElement} The created entry.
 */
export function createFavoriteBox(isFavorited) {
    const rowFavorite = document.createElement("td");
    rowFavorite.classList.add("row-favorite");
    const favWrapper = document.createElement("div");
    favWrapper.classList.add("fav-wrapper");

    const favIcon = document.createElement("img");
    favIcon.classList.add("fav-icon");
    favIcon.src = "./assets/img/fav-empty.png";
    favWrapper.dataset.favorited = `${isFavorited ? 0 : 1}`; // Inverted since a click event gets called to update image

    favIcon.onclick = () => {
        if(favWrapper.dataset.favorited === "0") {
            favIcon.src = "./assets/img/fav-full.png";
            favWrapper.dataset.favorited = "1";
        } else {
            favIcon.src = "./assets/img/fav-empty.png";
            favWrapper.dataset.favorited = "0";
        }
    };
    favIcon.click();

    favWrapper.appendChild(favIcon);
    rowFavorite.appendChild(favWrapper);

    return rowFavorite;
}

/**
 * Creates the options column entry for the row.
 * @param { (HTMLButtonElement) => void } statDisplayCallback Function that handles opening/closing the stats row for this row's unit.
 * @param { (HTMLButtonElement) => void } quickEditCallback A function that describes how to apply a quick-edit action to this row.
 * @returns {HTMLTableCellElement} The created options entry.
 */
export function createOptionsBox(statDisplayCallback, quickEditCallback) {
    const rowOptions = document.createElement("td");
    rowOptions.colSpan = 2;
    rowOptions.classList.add("row-option");
    const rowOptionAlign = document.createElement("div");
    rowOptionAlign.classList.add("row-option-wrapper");

    const viewStats = document.createElement("button");
    viewStats.classList.add("stat-display-option");
    viewStats.classList.add("option-button");
    viewStats.onclick = () => {
        if(!document.body.classList.contains("quick-update-enabled")) {
            statDisplayCallback(viewStats);
        } else {
            quickEditCallback(viewStats);
        }
    };

    rowOptionAlign.appendChild(viewStats);
    rowOptions.appendChild(rowOptionAlign);
    return rowOptions;
}