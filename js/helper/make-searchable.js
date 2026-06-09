//@ts-check
import { FORM } from "../data/unit-data.js";

let targettedInput = null;

/**
 * Makes an input searchable. Only has a visible effect if the dataset has been initialized.
 * @param {HTMLInputElement} input The input to make searchable.
 * @param {(id: number, form: FORM) => void} findCallback A function called when an option is selected from the search.
 */
export default function makeSearchable(input, findCallback) {
    const suggestionDropdown = /** @type {HTMLDivElement} */ (document.querySelector("#search-suggestion-dropdown"));

    function displayDropdown() {
        suggestionDropdown.querySelectorAll(".hidden").forEach(s => s.classList.remove("hidden"));
        input.dispatchEvent(new Event("keyup"));
        targettedInput = input;
        const inputBounds = input.getBoundingClientRect();
        const suggestionBounds = suggestionDropdown.getBoundingClientRect();
        suggestionDropdown.style.minWidth = `${inputBounds.width}px`;

        if(inputBounds.left + suggestionBounds.width > window.innerWidth) { // only right align when necessary
            suggestionDropdown.style.left = "";
            suggestionDropdown.style.right = `${window.innerWidth - inputBounds.left - window.scrollX}px`;
        } else {
            suggestionDropdown.style.right = "";
            suggestionDropdown.style.left = `${inputBounds.left + window.scrollX}px`;
        }

        if(inputBounds.bottom > window.innerHeight / 2) { // however, vertical align is just whichever has more space
            suggestionDropdown.style.top = "";
            suggestionDropdown.style.bottom = `${window.innerHeight - inputBounds.top - window.scrollY}px`;
        } else {
            suggestionDropdown.style.bottom = "";
            suggestionDropdown.style.top = `${inputBounds.bottom + window.scrollY}px`;
        }
        suggestionDropdown.classList.remove("invisible");
    }

    input.addEventListener("click", displayDropdown);
    input.addEventListener("focus", displayDropdown);
    input.addEventListener("blur", (/** @type {any} */ _ev) => {
        suggestionDropdown.classList.add("invisible");
        suggestionDropdown.style.top = "-10000000px";
        suggestionDropdown.style.left = "-10000000px";
        suggestionDropdown.querySelectorAll("div.hidden").forEach(d => d.classList.remove("hidden"));
    });
    input.addEventListener("suggest", (/** @type {Event} */ v) => {
        input.value = "";
        input.blur();
        suggestionDropdown.querySelectorAll(".hidden").forEach(s => s.classList.remove("hidden"));
        findCallback(/** @type {CustomEvent} */ (v).detail.id, /** @type {CustomEvent} */ (v).detail.form);
    });
    input.addEventListener("keydown", (/** @type {KeyboardEvent} */ ev) => {
        if(ev.key === "ArrowUp") {
            if(suggestionDropdown.children.length === 0) {
                return;
            }

            let target = suggestionDropdown.querySelector(".suggestion-hovered");
            if(!target) {
                target = suggestionDropdown.children[0];
            } else {
                target.classList.remove("suggestion-hovered");
            }

            do {
                if(target === suggestionDropdown.children[0]) {
                    target = suggestionDropdown.children[suggestionDropdown.children.length - 1];
                } else {
                    target = /** @type {HTMLDivElement} */ (target.previousElementSibling);
                }
            } while(target.classList.contains("hidden") || target.classList.contains("global-hidden"));

            target.classList.add("suggestion-hovered");
            ensureOnscreen(target, suggestionDropdown);
        } else if(ev.key === "ArrowDown") {
            if(suggestionDropdown.children.length === 0) {
                return;
            }

            let target = suggestionDropdown.querySelector(".suggestion-hovered");
            if(!target) {
                target = suggestionDropdown.children[suggestionDropdown.children.length - 1];
            } else {
                target.classList.remove("suggestion-hovered");
            }

            do {
                if(target === suggestionDropdown.children[suggestionDropdown.children.length - 1]) {
                    target = suggestionDropdown.children[0];
                } else {
                    target = /** @type {HTMLDivElement} */ (target.nextElementSibling);
                }
            } while(target.classList.contains("hidden") || target.classList.contains("global-hidden"));

            target.classList.add("suggestion-hovered");
            ensureOnscreen(target, suggestionDropdown);
        }
    });
    input.addEventListener("keyup", (/** @type {KeyboardEvent} */ ev) => {
        if(ev.key === "Enter") {
            let id = -1;
            let form = -1;

            const hovered = /** @type {HTMLDivElement} */ (suggestionDropdown.querySelector(".suggestion-hovered"));
            if(hovered) {
                id = parseInt(hovered.dataset.target ?? "0");
                form = parseInt(hovered.dataset.form ?? "0");
            } else if(!isNaN(parseInt(input.value))) {
                id = parseInt(input.value);
                const potential = suggestionDropdown.querySelector(`div[data-target="${id}"]`);
                if(!potential || potential.classList.contains("hidden")) {
                    return;
                }
                form = Math.max(.../** @type {HTMLDivElement[]} */ ([...suggestionDropdown.querySelectorAll(`div[data-target="${id}"]`)]).map(d => parseInt(d.dataset.form ?? "0")));
            } else {
                const idEntry = /** @type {HTMLDivElement|undefined} */ (suggestionDropdown.querySelector(`div[data-content="${input.value.trim().toLowerCase()}"]`));
                if(idEntry && !idEntry.classList.contains("hidden") && !idEntry.classList.contains("global-hidden")) {
                    id = parseInt(idEntry.dataset.target ?? "0");
                    form = parseInt(idEntry.dataset.form ?? "0");
                } else {
                    return;
                }
            }
        
            findCallback(id, form);
            input.value = "";
            input.blur();
        } else {
            const cleanValue = input.value.trim().toLowerCase();

            let shouldShow = false;
            for(const child of /** @type {HTMLCollectionOf<HTMLDivElement>} */ (suggestionDropdown.children)) {
                shouldShow = child.dataset.content?.includes(cleanValue) ?? false; // name substring
                shouldShow = shouldShow || (child.dataset.target?.includes(cleanValue) ?? false); // id substring
                child.classList.toggle("hidden", !shouldShow);

                if(child.classList.contains("suggestion-hovered") && (child.classList.contains("hidden") || child.classList.contains("global-hidden"))) {
                    child.classList.remove("suggestion-hovered");
                }
            }
        }
    });
}

/**
 * Scrolls the dropdown, if necessary, such that the provided dropdown is visible.
 * @param {Element} dropdownElement The element in the dropdown that must be visible.
 * @param {Element} dropdown The dropdown to be scrolled.
 */
function ensureOnscreen(dropdownElement, dropdown) {
    const suggestionBounds = dropdown.getBoundingClientRect();
    const targettedBounds = dropdownElement.getBoundingClientRect();

    if(targettedBounds.top <= suggestionBounds.top) {
        dropdown.scrollTop = dropdown.scrollTop + (targettedBounds.top - suggestionBounds.top);
    } else if(targettedBounds.bottom >= suggestionBounds.bottom) {
        dropdown.scrollTop = dropdown.scrollTop + (targettedBounds.bottom - suggestionBounds.bottom);
    }
}

/**
 * Creates an element that holds a dropdown menu of searchable divs.
 * @returns {HTMLDivElement} The element that contains the dropdown.
 */
export function createSearchDropdown() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("invisible");
    wrapper.id = "search-suggestion-dropdown";

    return wrapper;
}

/**
 * Creates a datalist containing all recorded unit forms, regardless of if the user owns the unit and their form.
 * @param {Element} datalist The element that will contain all searchable divs.
 * @param {[number, string|null, string|null, string|null, string|null][]} names The unit ID and name of each unit form, with the name of the form being null if the unit lacks that form.
 */
export async function initializeDataset(datalist, names) {
    for(let x = 0; x < names.length; x++) {
        appendSearchSuggestions(names[x], datalist);
    }

    const sorter = new Intl.Collator("en");
    [...datalist.children].sort((a, b) => sorter.compare(a.textContent?.toLowerCase() ?? "", b.textContent?.toLowerCase() ?? "")).forEach(n => datalist.appendChild(n));
}

/**
 * Event listener delegate that highlights a searchable div upon being hovered.
 * @param {HTMLDivElement} option The element that was hovered.
 * @param {Element} datalist The element containing all searchable divs.
 */
function suggestionOption_onEnter(option, datalist) {
    datalist.querySelector(".suggestion-hovered")?.classList.remove("suggestion-hovered");
    option.classList.add("suggestion-hovered");
}

/**
 * Creates a div that can be searched for and selected.
 * @param {string} text The name of the form to display in the search option.
 * @param {number} id The ID of the unit represented by this option.
 * @param {FORM} form The number representing what type of form the unit is.
 * @param {Element} datalist The element containing all searchable divs.
 * @returns {HTMLDivElement} The searchable element.
 */
function  createSearchOption(text, id, form, datalist) {
    const option = document.createElement("div");
    option.textContent = text;
    option.dataset.content = text.toLowerCase();
    option.dataset.target = `${id}`;
    option.dataset.form = `${form}`;

    option.addEventListener("mouseenter", () => suggestionOption_onEnter(option, datalist));
    option.addEventListener("mouseleave", () => option.classList.remove("suggestion-hovered"));
    option.addEventListener("mousedown", () => targettedInput?.dispatchEvent(new CustomEvent("suggest", { detail: { id: id, form: form } })));

    return option;
}

/**
 * Adds search options for the provided unit info to the datalist.
 * @param {[number, string|null, string|null, string|null, string|null]} data The id, normal form, evolved form, true form, and ultra form (respectively) of a unit.
 * @param {Element} datalist The element containing all search options for the page.
 */
function appendSearchSuggestions(data, datalist) {
    if(data[1]) {
        datalist.appendChild(createSearchOption(data[1], data[0], FORM.NORMAL, datalist));
    }
    if(data[2]) {
        datalist.appendChild(createSearchOption(data[2], data[0], FORM.EVOLVED, datalist));
    }
    if(data[3]) {
        datalist.appendChild(createSearchOption(data[3], data[0], FORM.TRUE, datalist));
    }
    if(data[4]) {
        datalist.appendChild(createSearchOption(data[4], data[0], FORM.ULTRA, datalist));
    }
}