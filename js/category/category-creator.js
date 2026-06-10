//@ts-check
import makeSearchable, { createSearchDropdown, initializeDataset } from "../helper/make-searchable.js";
import createSearchModal, { openSearchModal } from "../unit-table/creation/create-search-modal.js";
import { createSubCategoryButton, createSuperCategoryButton } from "./create-settings-category.js";

const MAX_CATEGORY_NAME_LENGTH = 64;

let selectedUnits = new Set();
let targetedKey = null;

/**
 * Initializes the category creator with any custom categories already created in localStorage.
 * @param {(isFiltered: boolean) => Promise<import("../data/category-data.js").CATEGORY_MAP>} getCategories A function that gets an object containing all categories and super-categories.
 * @param {(category: string, IDs: number[]) => Promise<void>} modifyCategory A function that creates or modifies a custom category to contain the provided unit IDs.
 * @param {(category: string) => Promise<void>} removeCategory A function that deletes a custom category.
 * @param {[number, string|null, string|null, string|null, string|null][]} names The unit ID and name of each unit form, with the name of the form being null if the unit lacks that form.
 * @param {(msg: string, isError: boolean) => void} completionMessager A callback used to alert the user about errors in their custom category, or to confirm a successful category operation.
 */
export function initializeCategoryCreator(getCategories, modifyCategory, removeCategory, names, completionMessager) {
    const wrapper = /** @type {!HTMLDivElement} */ (document.querySelector("#category-creator"));
    const antiWrapper = /** @type {!HTMLDivElement} */ (document.querySelector("#category-creator-menu"));
    const chipList = /** @type {!HTMLDivElement} */ (document.querySelector("#category-units"));
    const categoryName = /** @type {!HTMLInputElement} */ (document.querySelector("#category-name"));
    const cancelButton = /** @type {!HTMLButtonElement} */ (document.querySelector("#cancel-category-creation"));
    const createButton = /** @type {!HTMLButtonElement} */ (document.querySelector("#create-category-creation"));

    const datalist = createSearchDropdown();
    document.body.appendChild(datalist);
    document.body.appendChild(createSearchModal());

    const searchResultFunc = (id) => {
        if(!selectedUnits.has(id)) {
            selectedUnits.add(id);
            const chip = createChip(id);
            if(chipList.children.length === 0) {
                chipList.appendChild(chip);
            } else {
                let pos = 0;
                // @ts-ignore Why does it return an Element instead of an HTMLElement ahh
                const targetID = chipList.children[pos].dataset.id;
                while(pos < chipList.children.length && targetID && id > parseInt(targetID)) {
                    pos++;
                }
                if(pos === chipList.children.length) {
                    chipList.appendChild(chip);
                } else {
                    chipList.children[pos].insertAdjacentElement("beforebegin", chip);
                }
            }
            
            const formNameOptions = document.querySelectorAll(`#search-suggestion-dropdown div[data-target="${id}"]`);
            formNameOptions.forEach(o => {
                o.classList.add("global-hidden");
                o.classList.remove("suggestion-hovered");
            });
        }
    };

    makeSearchable(/** @type {HTMLInputElement} */ (document.querySelector("#add-unit")), searchResultFunc);
    initializeDataset(datalist, names);
    /** @type {HTMLButtonElement} */ (document.querySelector("#add-unit-advanced")).onclick = () => openSearchModal((u, f) => searchResultFunc(u.id), false);
    

    cancelButton.onclick = () => {
        selectedUnits.clear();
        antiWrapper.classList.remove("hidden");
        wrapper.classList.add("hidden");
        const formNameOptions = document.querySelectorAll(`#search-suggestion-dropdown div.global-hidden`);
        formNameOptions.forEach(o => o.classList.remove("global-hidden"));
        completionMessager("Cancelled category creation.", false);
    };

    getCategories(true).then(categories => {
        const custom = categories["custom"] ?? {};

        const opener = /** @type {!HTMLButtonElement} */ (document.querySelector("#open-creator"));
        const remover = /** @type {!HTMLButtonElement} */ (document.querySelector("#delete-category"));
        const existingList = /** @type {!HTMLDivElement} */ (document.querySelector("#created-category-list"));
        for(const existing of Object.keys(custom)) {
            existingList.appendChild(createCategorySelectionButton(existing));
        }

        opener.onclick = () => {
            if(targetedKey && custom[targetedKey]) {
                for(const preselected of custom[targetedKey]) {
                    const formNameOptions = document.querySelectorAll(`#search-suggestion-dropdown div[data-target="${preselected}"]`);
                    formNameOptions.forEach(o => {
                        o.classList.add("global-hidden");
                        o.classList.remove("suggestion-hovered");
                    });
                }
            }
            openCategoryModifier(targetedKey, custom[targetedKey]);
        };
        remover.onclick = () => {
            if(targetedKey) {
                removeCustomCategory(targetedKey, removeCategory).then(_ => {
                    delete custom[targetedKey];
                    targetedKey = null;
                    opener.textContent = "Create Category";
                    completionMessager("Category removed...", false);
                });
            }
            remover.disabled = true;
        };

        createButton.onclick = () => {
            const trimName = categoryName.value.trim();
            if(chipList.children.length === 0) {
                completionMessager("Category must have at least one unit!", true);
            } else if(!trimName) {
                completionMessager("Category must have a name!", true);
            } else if(trimName.length > MAX_CATEGORY_NAME_LENGTH) {
                completionMessager(`Category name must be at most ${MAX_CATEGORY_NAME_LENGTH} characters long!`, true);
            } else if(trimName !== targetedKey && Object.keys(custom).includes(trimName)) {
                completionMessager("A custom category with that name already exists!", true);
            } else {
                const categoryValues = [...selectedUnits.values()];
                delete custom[targetedKey];
                const formNameOptions = document.querySelectorAll(`#search-suggestion-dropdown div.global-hidden`);
                formNameOptions.forEach(o => o.classList.remove("global-hidden"));
                addCustomCategory(trimName, categoryValues, modifyCategory, removeCategory).then(_ => {
                    custom[trimName] = categoryValues;
                    
                    antiWrapper.classList.remove("hidden");
                    wrapper.classList.add("hidden");
                    selectedUnits.clear();
                    completionMessager(`${targetedKey ? "Modified" : "Created"} custom category!`, false);
                });
            }
        };
    });
}

/**
 * Opens an already-created custom category in the custom category editor, or creates a new, empty, custom category.
 * @param {string|null} [originalName=null] The name of the category, or null if the category is new.
 * @param {number[]|null} [originalUnits=null] A list of units by ID included in the category, or null if the category is new.
 */
export function openCategoryModifier(originalName = null, originalUnits = null) {
    const wrapper = /** @type {!HTMLDivElement} */ (document.querySelector("#category-creator"));
    const antiWrapper = /** @type {!HTMLDivElement} */ (document.querySelector("#category-creator-menu"));
    const chipList = /** @type {!HTMLDivElement} */ (document.querySelector("#category-units"));
    const categoryName = /** @type {!HTMLInputElement} */ (document.querySelector("#category-name"));
    const createButton = /** @type {!HTMLButtonElement} */ (document.querySelector("#create-category-creation"));

    chipList.innerHTML = "";

    if(originalName && originalUnits) {
        categoryName.value = originalName;
        for(const id of originalUnits.sort((/** @type {number} */ a, /** @type {number} */ b) => a - b)) {
            chipList.appendChild(createChip(id));
            selectedUnits.add(id);
        }
        createButton.textContent = "Modify";
    } else {
        categoryName.value = "";
        chipList.innerHTML = "";
        createButton.textContent = "Create";
    }

    antiWrapper.classList.add("hidden");
    wrapper.classList.remove("hidden");
}

/**
 * Creates a chip, which is a unit icon with ID used to display units in a custom category.
 * @param {number} id The unit ID to create a chip for.
 * @returns {HTMLDivElement} A chip.
 */
function createChip(id) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("chip");
    
    const icon = document.createElement("img");
    icon.classList.add("unit-icon");
    icon.src = `../../assets/img/unit_icon/${id}_0.png`;

    const removeUnit = document.createElement("div");
    removeUnit.classList.add("remove-unit");
    removeUnit.textContent = "x";
    removeUnit.onclick = () => {
        selectedUnits.delete(id);
        wrapper.remove();
    };

    wrapper.append(icon, removeUnit);
    return wrapper;
}

/**
 * Adds a custom category to the creator list, the global filter list, and to localStorage.
 * @param {string} categoryName The name to give the custom category, which must be unique from all other custom categories.
 * @param {number[]} categoryIDs A list of unit IDs to add to the category.
 * @param {(category: string, IDs: number[]) => Promise<void>} modifyCategory A function that creates or modifies a custom category to contain the provided unit IDs.
 * @param {(category: string) => Promise<void>} removeCategory A function that deletes a custom category.
 */
async function addCustomCategory(categoryName, categoryIDs, modifyCategory, removeCategory) {
    if(targetedKey && targetedKey !== categoryName) {
        await removeCustomCategory(targetedKey, removeCategory);
    }

    let customDiv = document.querySelector("#gk-custom .sub-category-wrapper");
    if(!customDiv) { // If custom super-category needs to be added to global category selection
        const insertingInto = /** @type {!HTMLDivElement} */ (document.querySelector("#category-selection"));
        const inserting = createSuperCategoryButton("custom", []);

        let inserted = false; // insert custom category in alphabetical order
        for (const child of insertingInto.children) {
            if (child.id.localeCompare(inserting.id) > 0) {
                child.insertAdjacentElement("beforebegin", inserting);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            insertingInto.appendChild(inserting);
        }
    }

    if(!targetedKey || targetedKey !== categoryName) {
        customDiv = /** @type {!HTMLDivElement} */ (document.querySelector("#gk-custom .sub-category-wrapper"));
        
        window.localStorage.setItem(`gk-custom-${categoryName}`, "1");
        const inserting = createSubCategoryButton(`custom-${categoryName}`, categoryName, 0);

        let inserted = false;
        for (const child of customDiv.children) {
            if (child.textContent?.toLocaleLowerCase().localeCompare(categoryName.toLocaleLowerCase()) ?? -1 > 0) {
                child.insertAdjacentElement("beforebegin", inserting);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            customDiv?.appendChild(inserting);
        }

        const insertedButton = createCategorySelectionButton(categoryName);
        document.querySelector("#created-category-list")?.appendChild(insertedButton);
        insertedButton.click();
        targetedKey = categoryName;
    }

    modifyCategory(categoryName, categoryIDs);
}

/**
 * Removes a custom category from the global category selection menu and localStorage.
 * @param {string} categoryName The name of the custom category to remove.
 * @param {(category: string) => Promise<void>} removeCategory A function that deletes a custom category.
 */
async function removeCustomCategory(categoryName, removeCategory) {
    window.localStorage.removeItem(`gk-custom-${categoryName}`);

    const customWrapper = document.querySelector("#gk-custom");
    if(!customWrapper) {
        return;
    }

    const customButtonElements = customWrapper.querySelector(".sub-category-wrapper")?.children;
    if(customButtonElements) {
        const customButtons = [...customButtonElements];
        customButtons.find(c => c.textContent === categoryName)?.remove();
        if(customButtons.length === 1) {
            customWrapper.remove();
        }
    }

    const customList = document.querySelector("#created-category-list")?.children;
    if(customList) {
        [...customList].find(c => c.textContent === categoryName)?.remove();
    }
    await removeCategory(categoryName);
}

/**
 * Creates a button used to select a custom category.
 * @param {string | null} categoryName
 * @returns {HTMLButtonElement} The created button.
 */
function createCategorySelectionButton(categoryName) {
    const catButton = document.createElement("button");
    const existingList = document.querySelector("#created-category-list");
    const opener = /** @type {!HTMLButtonElement} */ (document.querySelector("#open-creator"));
    const remover = /** @type {!HTMLButtonElement} */ (document.querySelector("#delete-category"));

    catButton.type = "button";
    catButton.classList.add("filter-button");
    catButton.classList.add("inactive");
    catButton.textContent = categoryName;
    catButton.onclick = () => {
        const toggleState = catButton.classList.contains("inactive");
        existingList?.querySelectorAll("button").forEach(b => b.classList.add("inactive"));
        remover.disabled = !toggleState;
        if(toggleState) {
            catButton.classList.remove("inactive");
            opener.textContent = "Modify Category";
            targetedKey = categoryName;
        } else {
            opener.textContent = "Create Category";
            targetedKey = null;
        }
    };

    return catButton;
}