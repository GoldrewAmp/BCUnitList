//@ts-check
import { getModalTarget } from "../filter-units.js";
import { favoriteSortLambda, formSortLambda, gameSortLambda, idSortLambda, levelSortLambda, nameSortLambda, orbSortLambda, sortRows, talentSortLambda } from "../sort-units.js";
import * as orbData from "../../../assets/orb-map.js";
const ORB_DATA = orbData.default;

/**
 * Creates a table modal, used to mass-update, filter, and sort unit tables.
 * @returns {HTMLDivElement} The table option and filter modal.
 */
export default function createTableOptionModal() {
    const modal = document.createElement("div");
    modal.id = "table-option-modal";
    modal.classList.add("modal-bg");
    modal.classList.add("hidden");

    const modalFill = document.createElement("div");
    modalFill.classList.add("modal-fill");

    const exit = document.createElement("div");
    exit.id = "table-option-cancel";
    exit.classList.add("modal-close");

    modal.addEventListener("click", ev => {
        if(ev.target === modal) exit.dispatchEvent(new Event("click"));
    });
    
    const closeX = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    closeX.setAttribute("viewBox", "0 0 64 64");
    closeX.innerHTML = '<polygon points="10,0 0,10 54,64 64,54" /><polygon points="54,0 64,10 10,64 0,54" />';
    exit.appendChild(closeX);

    const label = document.createElement("h2");
    const labelSpan = document.createElement("span");
    labelSpan.id = "table-option-label";
    label.append(labelSpan, " Options");

    const content = document.createElement("div");
    content.classList.add("v-align");
    content.append(createOptionSelection(), createFilterSelection());

    modalFill.append(label, content);
    modal.append(modalFill, exit);
    return modal;
}

/**
 * Creates a container with all options that can be applied to the entire table, including sorts.
 * @returns {HTMLDivElement} A container for all table options and sorts.
 */
function createOptionSelection() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-option-selection");

    const title = document.createElement("h3");
    title.textContent = "Modify Units";

    const options = document.createElement("div");
    options.id = "table-update-options";

    const twoPaneToggle = document.createElement("div");
    twoPaneToggle.id = "table-update-target-focus";

    const panel1 = document.createElement("div");
    const panel1Input = document.createElement("input");
    panel1Input.type = "checkbox";
    panel1Input.id = "update-owned-only";
    panel1Input.title = "Only update owned units (Level ≥ 1)";

    const panel1Label = document.createElement("label");
    panel1Label.htmlFor = "update-owned-only";
    panel1Label.textContent = "Only apply to owned units";
    panel1Label.title = "Only update owned units (Level ≥ 1)";

    panel1.append(panel1Label, panel1Input);

    const panel2 = document.createElement("div");
    const panel2Input = document.createElement("input");
    panel2Input.type = "checkbox";
    panel2Input.id = "update-visible-only";
    panel2Input.title = "Only update units that aren't hidden by a filter or the unit's hide button";
    panel2Input.checked = true;

    const panel2Label = document.createElement("label");
    panel2Label.htmlFor = "update-visible-only";
    panel2Label.textContent = "Only apply to visible units";
    panel2Label.title = "Only update units that aren't hidden by a filter or the unit's hide button";

    panel2.append(panel2Label, panel2Input);
    twoPaneToggle.append(panel1, panel2);

    const optionButtonCollection = document.createElement("div");
    optionButtonCollection.id = "table-modal-modifer-options";
    optionButtonCollection.classList.add("h-align");

    const updateMultiselect = document.createElement("div");
    updateMultiselect.id = "table-modal-modifier-multiselect";
    updateMultiselect.classList.add("table-filter-group");
    
    const maxList = [
        createModalButton("Obtain unit (level 0 -> level 1)", "own-all", "Own"),
        createModalButton("Put unit in its highest form", "fully-evolve-all", "Fully Evolve"),
        createModalButton("Level up unit to level 30", "level-30-all", "Level to 30"),
        createModalButton("Level up unit to level 50", "level-50-all", "Level to 50"),
        createModalButton("Level up unit to their highest possible + level", "level-plus-ultra", "Max + Level"),
        createModalButton("Level up regular talents to maximum amount", "level-talents", "Max Talents"),
        createModalButton("Level up ultra talents to maximum amount", "level-ultra-talents", "Max Ultra Talents")
    ];
    maxList.forEach(b => {
        b.classList.add("inactive");
        b.onclick = () => b.classList.toggle("inactive");
    });
    updateMultiselect.append(...maxList);

    const uniqueList = [
        createModalButton("Hide hidden units", "hide-all", "Hide"),
        createModalButton("Show hidden units", "unhide-all", "Unhide"),
        createModalButton("Reset all changes to unit", "reset-all", "Reset")
    ];
    uniqueList.forEach(b => {
        b.classList.add("inactive");
        b.onclick = () => {
            const status = b.classList.contains("inactive");
            uniqueList.forEach(b2 => {
                b2.classList.add("inactive");
            });
            b.classList.toggle("inactive", !status);

            maxList.forEach(a => a.disabled = status);
        }
    });

    const uniqueWrapper = document.createElement("div");
    uniqueWrapper.id = "disjoint-update-options";
    uniqueWrapper.classList.add("table-filter-group");
    uniqueWrapper.append(...uniqueList);

    const applyAllWrapper = document.createElement("div");
    applyAllWrapper.id = "table-update-all-wrapper";

    const applyAllButton = createModalButton("Apply all of the selected updates to every unit in the table", "apply-to-all", "Apply to All");
    const toggleEditModeButton = createModalButton("Enter or exit editing mode, which allows for quickly applying any of the selected update options to specific units", "toggle-update-column", "Quick-Edit Mode");
    toggleEditModeButton.classList.add("inactive");
    toggleEditModeButton.onclick = () => {
        const status = !toggleEditModeButton.classList.toggle("inactive");
        document.body.classList.toggle("quick-update-enabled", status);
        /** @type {HTMLTableCellElement} */ (getModalTarget().querySelector("thead .head-option")).textContent = (status ? "Quick-Edit" : "Stats");
    };

    applyAllWrapper.append(applyAllButton, toggleEditModeButton);

    optionButtonCollection.append(uniqueWrapper, updateMultiselect, applyAllWrapper, twoPaneToggle);
    options.appendChild(optionButtonCollection);

    const title2 = document.createElement("h3");
    title2.textContent = "Sort Table";

    wrapper.append(title, options, title2, createSortSelection());
    return wrapper;
}

/**
 * Creates all sorts for the modal.
 * @returns {HTMLDivElement} A container for all sort buttons.
 */
function createSortSelection() {
    const sortWrapper = document.createElement("div");
    sortWrapper.id = "table-modal-sort";

    const ascendBtn = document.createElement("button");
    ascendBtn.type = "button";
    ascendBtn.id = "sort-selection-asc";

    const ascendText = document.createElement("span");
    ascendText.textContent = "Ascending";

    ascendBtn.onclick = () => {
        ascendText.textContent = (ascendText.textContent?.startsWith("A") ? "Descending" : "Ascending");
        const res = ascendBtn.classList.toggle("descending");
        const sortButton = /** @type {HTMLDivElement} */ (getModalTarget().querySelector("thead .column-header-text td.ascending, thead .column-header-text .descending"));
        if(sortButton) {
            if(sortButton.classList.contains("descending") !== res) {
                sortButton.click();
            }
        } else {
            sortRows(/** @type {HTMLTableSectionElement} */ (getModalTarget().querySelector("tbody")), gameSortLambda, !res);
        }
    }
    ascendBtn.innerHTML = `
        <svg class="sort-direction" viewBox="0 0 32 32">
            <path d="M0 32 L16 0 L32 32"></path>
        </svg>
    `;
    ascendBtn.prepend(ascendText);

    sortWrapper.append(
        createSortModalButton("Order units like in-game", "ingame-sort", "In-Game", gameSortLambda, ascendBtn),
        createSortModalButton("Order units by their ID number", "id-sort", "ID", idSortLambda, ascendBtn, "sort-id"),
        createSortModalButton("Order units by their current evolution", "form-sort", "Form", formSortLambda, ascendBtn, "sort-form"),
        createSortModalButton("Order units by the current form's name, alphabetically", "alphabetical-sort", "Alphabetical", nameSortLambda, ascendBtn, "sort-name"),
        createSortModalButton("Order units by the sum of their level and + level", "level-sort", "Total Level", levelSortLambda, ascendBtn, "sort-level"),
        createSortModalButton("Order units by the number of completed talents", "talent-sort", "Talent Level", talentSortLambda, ascendBtn, "sort-talent"),
        createSortModalButton("Order units by the quality of attached orbs", "orb-sort", "Orb Quality", orbSortLambda, ascendBtn, "sort-orb"),
        createSortModalButton("Order units by whether they're favorited", "favorited-sort", "Favorited", favoriteSortLambda, ascendBtn, "sort-favorite"),
        ascendBtn
    );

    return sortWrapper;
}

/**
 * Creates a filter button.
 * @param {string} title The button description.
 * @param {string} id An ID to assign to the button.
 * @param {string} text The text displayed on the button.
 * @param {(a: HTMLTableRowElement, b: HTMLTableRowElement) => number} sortFunc A function that compares two unit rows and returns a comparator output.
 * @param {HTMLElement} ascendBtn A button that represents whether the sort direction should be ascending or descending.
 * @param {string} sortAssociate The class of the associated thead button that performs the same sort, if any.
 * @returns {HTMLButtonElement} The created button.
 */
function createSortModalButton(title, id, text, sortFunc, ascendBtn, sortAssociate = "") {
    const button = createModalButton(title, id, text);
    button.onclick = () => {
        sortRows(/** @type {HTMLTableSectionElement} */ (getModalTarget().querySelector("tbody")), sortFunc, !ascendBtn.classList.contains("descending"));
        // TODO: Set ascending/descending on repsective thead element in getModalTarget
        getModalTarget().querySelectorAll("thead .column-header-text td").forEach(t => { t.classList.remove("descending", "ascending"); });
        if(sortAssociate) {
            getModalTarget().querySelector(`thead .column-header-text .${sortAssociate}`)?.classList.add(ascendBtn.classList.contains("descending") ? "descending" : "ascending");
        }
    };

    return button;
}

/**
 * Creates all filters for the modal.
 * @returns {HTMLDivElement} A container for all filter buttons.
 */
function createFilterSelection() {
    const wrapper = document.createElement("div");

    const label = document.createElement("h3");
    label.textContent = "Filter Table";

    const filterButtonCollection = document.createElement("div");
    filterButtonCollection.id = "table-filter-options";

    filterButtonCollection.appendChild(createModalButtonSuperGroup("Misc", [
        createModalButton("Units that cannot be added to a loadout without cheating (e.g. Summons)", "fake-filter", "Unreleased"),
        createModalButton("Collab Exclusive Units", "collab-filter", "Collab"),
        createModalButton("JP/KR/TW Exclusive Units", "version-filter", "Not in EN")
    ], [
        createModalButton("Obtained Units", "obtained-filter", "Obtained"),
        createModalButton("Unobtained Units", "unobtained-filter", "Unobtained"),
        createModalButton("Favorited Units", "favorite-filter", "Non-favorited")
    ]));

    filterButtonCollection.appendChild(createModalButtonSuperGroup("Unit Forms", [
        createModalButton("Normal Form Units", "normal-filter", "NF"),
        createModalButton("Evolved Form Units", "evolved-filter", "EF"),
        createModalButton("True Form Units", "true-filter", "TF"),
        createModalButton("Ultra Form Units", "ultra-filter", "UF")
    ], [
        createModalButton("Fully Evolved Units", "fully-evolved-filter", "Form MAX"),
        createModalButton("Not Fully Evolved Units", "not-fully-evolved-filter", "Form Not MAX")
    ]));

    filterButtonCollection.appendChild(createModalButtonSuperGroup("Unit Levels", [
        createModalButton("Max Regular Level", "max-lvl-filter", "Max Lvl"),
        createModalButton("Not Max Regular Level", "not-max-lvl-filter", "Not Max Lvl"),
        createModalButton("Max Level of 1", "lvl-1-filter", "Max Lvl 1")
    ], [
        createModalButton("Max Plus Level", "max-plus-filter", "Max + Lvl"),
        createModalButton("Not Max Plus Level", "not-max-plus-filter", "Not Max + Lvl"),
        createModalButton("Max Plus Level of 0", "plus-0-filter", "No + Lvls")
    ]));

    filterButtonCollection.appendChild(createModalButtonSuperGroup("Unit Talents", [
        createModalButton("Regular Talents Max Level", "max-talent-filter", "Max Talents"),
        createModalButton("Regular Talents not Max Level", "not-max-talent-filter", "Not Max Talents")
    ], [
        createModalButton("Ultra Talents Max Level", "max-ut-filter", "Max UT"),
        createModalButton("Ultra Talents not Max Level", "not-max-ut-filter", "Not Max UT")
    ], [
        createModalButton("Can Have Regular Talents", "has-talent-filter", "Can Have Talents"),
        createModalButton("Can Have Ultra Talents", "has-ut-filter", "Can Have UTs"),
        createModalButton("Cannot Have any Talents", "talentless-filter", "Can't Have Talents"),
        createModalButton("Cannot Have any Ultra Talents", "utless-filter", "Can't Have UTs")
    ]));

    const traitModals = [
        createModalButton("Has Empty Orb Slots", "trait-empty-filter", "Empty"),
        ...ORB_DATA.traits.map((t, i) => createModalButton(`Has Anti-${t} Orb Equipped`, `trait-${i}-filter`, t))
    ];
    traitModals.push(createModalButton("Has Ability Orb Equipped", "trait-ability-filter", "Ability"));
    const typeModals = ORB_DATA.types.map((t, i) => createModalButton(`Has ${t} Orb Equipped`, `type-effect-${i}-filter`, t));
    const typeModals2 = ORB_DATA.abilities.map((t, i) => createModalButton(`Has ${t} Orb Equipped`, `type-ability-${i}-filter`, t))
        .reduce((/** @type {HTMLButtonElement[][]} */ acc, item, index) => {
            const pos = Math.floor(index / 8);
            acc[pos] ??= [];
            acc[pos].push(item);
            return acc;
        }, []);
    const rankModals = ORB_DATA.ranks.map((r, i) => createModalButton(`Has ${r} Rank Orb Equipped`, `rank-${i}-filter`, r));

    filterButtonCollection.appendChild(createModalButtonSuperGroup("Talent Orbs", traitModals, typeModals, ...typeModals2, rankModals));

    wrapper.append(label, filterButtonCollection);
    return wrapper;
}

/**
 * Creates a filter button.
 * @param {string} title The button description.
 * @param {string} id An ID to assign to the button.
 * @param {string} text The text displayed on the button.
 * @returns {HTMLButtonElement} The created button.
 */
function createModalButton(title, id, text) {
    const button = document.createElement("button");
    button.classList.add("table-option-button");
    button.type = "button";
    button.textContent = text;
    button.id = id;
    button.title = title;

    return button;
}

/**
 * Creates a container for multiple groups of filter buttons, ideally themed around a specific quality of a unit.
 * @param {string} title The title of the container.
 * @param {HTMLButtonElement[][]} buttonGroups A list of button groups.
 * @returns {HTMLDivElement} The container and buttons contained within.
 */
function createModalButtonSuperGroup(title, ...buttonGroups) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("table-filter-group");

    const groupTitle = document.createElement("h4");
    groupTitle.textContent = title;
    wrapper.appendChild(groupTitle);

    for(const group of buttonGroups) {
        const groupWrapper = document.createElement("div");
        groupWrapper.classList.add("h-align");
        groupWrapper.append(...group);
        wrapper.appendChild(groupWrapper);
    }

    return wrapper;
}