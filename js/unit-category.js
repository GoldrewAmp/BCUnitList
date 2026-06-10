//@ts-check
import createLoadingBar from "./helper/loading.js";
import createOrbMenu from "./unit-table/orb/create-orb-selector.js";
import { initializeOrbSelection } from "./unit-table/orb/orb-selection.js";
import createTableOptionModal from "./unit-table/creation/create-table-modal.js";
import * as CategorySelector from "./category/category-selector.js";
import createSearchableTable from "./unit-table/creation/create-unit-table.js";
import { attachTableOptionsAndFilters, initializeTableModal } from "./unit-table/filter-units.js";
import { observeRowChange } from "./helper/link-row.js";
import { checkPort, REQUEST_TYPES } from "./communication/iframe-link.js";
import { parseSnakeCase } from "./helper/parse-string.js";
import { registerSyncedRow, syncRowValues } from "./unit-table/sync-tables.js";

/**
 * Initializes page elements once page has loaded.
 */
window.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(CategorySelector.createCategorySelector());
    [...(/** @type {HTMLDivElement} */ (document.querySelector("#base-categories .category-row"))).children].slice(0, -1).forEach(c => c.classList.add("hidden"));
    document.body.appendChild(createOrbMenu());
    initializeOrbSelection();
    document.body.appendChild(createTableOptionModal());
    initializeTableModal();

    window.addEventListener("portLoaded", loadCategories);
    if(checkPort()) {
        window.dispatchEvent(new CustomEvent("portLoaded"));
    }
});

/**
 * Initializes static content on the page.
 */
function loadCategories() {
    const loadingBar = createLoadingBar(2, () => {
        CategorySelector.allowSelection();
    });

    REQUEST_TYPES.GET_FAVORITED_DATA().then(data => {
        const subWrapper = /** @type {HTMLTableElement} */ (document.querySelector("#favorited-table"));
        subWrapper.classList.add("table-wrapper");

        const table = createTableFromData("Favorited", data, loadingBar);
        table.classList.add("favorited-table-marker");
        subWrapper.appendChild(table);
        attachTableOptionsAndFilters(table);

        loadingBar.increment();
    });

    REQUEST_TYPES.GET_CATEGORIES().then(categories => {
        if(window.localStorage.getItem("s7") === "0") {
            appendAllCategoryTables(loadingBar, categories);
        } else {
            const categorySearchBuiltin = document.querySelector("#builtin-categories");
            const replaceTable = /** @type {HTMLDivElement} */ (document.querySelector("#favorited-table"));

            /** @type {HTMLButtonElement} */ (document.querySelector("#base-categories .favorited-color")).onclick = () => {
                replaceTable.innerHTML = "";
                REQUEST_TYPES.GET_FAVORITED_DATA().then(data => {
                    const table = createTableFromData("Favorited", data, loadingBar);
                    table.classList.add("favorited-table-marker");
                    replaceTable.appendChild(table);
                    attachTableOptionsAndFilters(table);

                    loadingBar.increment();
                });
            };
            document.querySelector("#category-label-centering")?.classList.add("hidden");

            const waitArray = [];
            for(const key of Object.keys(categories).sort()) {
                const subButtons = [];

                for(const subCategory of Object.keys(categories[key]).sort()) {
                    const categoryButton = document.createElement("button");
                    categoryButton.type = "button";
                    categoryButton.textContent = parseSnakeCase(subCategory);
                    categoryButton.onclick = () => {
                        replaceTable.innerHTML = "";
                        appendCategoryUnitTable(key, subCategory, replaceTable, categories, loadingBar);
                    };

                    subButtons.push(categoryButton);
                    if(window.localStorage.getItem("s3") === "0") {
                        waitArray.push(REQUEST_TYPES.IS_ANY_UNFILTERED(categories[key][subCategory]).then(res => categoryButton.classList.toggle("hidden", !res)));
                    }
                }
                categorySearchBuiltin?.appendChild(CategorySelector.createCategory(parseSnakeCase(key), subButtons));
            }

            Promise.all(waitArray).then(_res => loadingBar.increment());
        }
    });
}

/**
 * Creates a table for every non-filtered category.
 * @param {import("./helper/loading.js").LOADING_BAR} loadingBar A loading bar that hides the screen until all tables are loaded.
 * @param {import("./data/category-data.js").CATEGORY_MAP} categoryData Every super-category, sub-category, and the units in each sub-category.
 */
function appendAllCategoryTables(loadingBar, categoryData) {
    const categoryGrouping = document.querySelector("#builtin-section");
    const categorySearchBuiltin = document.querySelector("#builtin-categories");

    const tables = [];
    for(const key of Object.keys(categoryData).sort()) {
        const superCategory = document.createElement("div");
        superCategory.classList.add("super-category");

        const superCategoryName = document.createElement("h4");
        superCategoryName.classList.add("clickable");
        const superName = parseSnakeCase(key);
        let hidden = false;
        superCategoryName.onclick = () => {
            hidden = !hidden;
            superCategory.querySelectorAll(".table-wrapper").forEach(t => t.classList.toggle("hidden", hidden));
        };
        superCategoryName.textContent = superName;
        superCategory.appendChild(superCategoryName);

        const subButtons = [];
        for(const subCategory of Object.keys(categoryData[key]).sort()) {
            const subWrapper = document.createElement("div");
            subWrapper.classList.add("table-wrapper");

            const nameTemplate = document.createElement("p");
            nameTemplate.classList.add("hidden");
            nameTemplate.textContent = parseSnakeCase(subCategory);
            subWrapper.appendChild(nameTemplate);

            tables.push(appendCategoryUnitTable(key, subCategory, subWrapper, categoryData, loadingBar));

            if(window.localStorage.getItem("s5") === "1") {
                subWrapper.classList.add("hidden");
                hidden = true;
            }

            subButtons.push(CategorySelector.createCategoryButton(parseSnakeCase(subCategory), subWrapper));
            superCategory.appendChild(subWrapper);
            loadingBar.rincrement();
        }

        categorySearchBuiltin?.appendChild(CategorySelector.createCategory(superName, subButtons));
        categoryGrouping?.appendChild(superCategory);
    }

    Promise.all(tables).then(_ => {
        loadingBar.increment();
});
}

/**
 * Creates a unit table for a category, and appends it to the provided target.
 * @param {string} superCategory The name of the super-category the category is a part of.
 * @param {string} categoryName The name of the category.
 * @param {Element} target The element to append the table to.
 * @param {import("./data/category-data.js").CATEGORY_MAP} categoryData All category data.
 * @param {import("./helper/loading.js").LOADING_BAR} loadingBar A loading bar used to hide the page until all elements are loaded.
 */
async function appendCategoryUnitTable(superCategory, categoryName, target, categoryData, loadingBar) {
    return REQUEST_TYPES.GET_MULTIPLE_DATA(categoryData[superCategory][categoryName]).then(data => {
        if(data.length > 0 || window.localStorage.getItem("s3") === "1") {
            const table = createTableFromData(parseSnakeCase(categoryName), data, loadingBar);
            target.appendChild(table);
            attachTableOptionsAndFilters(table);
        } else {
            [...document.querySelectorAll("#builtin-categories button")].find(b => b.textContent === parseSnakeCase(categoryName))?.classList.add("hidden");
        }
    });
}

/**
 * Creates a table from a list of unit data.
 * @param {string} tableName The name of the table.
 * @param {import("./data/unit-data.js").UNIT_DATA[]} data The data to add to the table.
 * @param {import("./helper/loading.js").LOADING_BAR | null | undefined} loadingBar A loading bar to hide the page until the page elements have loaded.
 * @returns {HTMLDivElement} An element containing the created table.
 */
function createTableFromData(tableName, data, loadingBar) {
    const table = createSearchableTable(tableName, data, REQUEST_TYPES.UPDATE_ID, loadingBar);

    if(window.localStorage.getItem("s7") === "0") {
        const body = /** @type {HTMLTableSectionElement} */ (table.querySelector("tbody"));

        for(const row of body.querySelectorAll("tr.unit-mod-row")) {
            const id = parseInt(row.querySelector(".row-id")?.textContent ?? "0");
            // @ts-ignore adding a class to a .querySelector prevents recognizing element type
            registerSyncedRow(row, id);
            // @ts-ignore adding a class to a .querySelector prevents recognizing element type
            observeRowChange(row, () => syncRowValues(row, id));
        }
    }

    return table;
}