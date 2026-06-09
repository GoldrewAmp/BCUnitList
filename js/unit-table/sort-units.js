//@ts-check
import * as sortOrderModule from "../../assets/unit_data/sort_order.js";

const ORB_ORDER = ["none", "D", "C", "B", "A", "S"];
const RARITY_ORDER = ["N", "EX", "RR", "SR", "UR", "LR"];
const SORT_ORDER = sortOrderModule.default;
const SORT_SETTING_ORDER = [gameSortLambda, idSortLambda, nameSortLambda, formSortLambda, levelSortLambda, talentSortLambda, orbSortLambda, favoriteSortLambda]

/**
 * Initializes a unit table by creating column headers that can sort rows once added.
 * @param {HTMLTableElement} table
 */
export default function attachUnitTableColumnSort(table) {
    const thead = /** @type {HTMLTableSectionElement} */ (table.querySelector("thead"));

    const sortID = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-id"));
    const sortForm = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-form"));
    const sortName = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-name"));
    const sortLevel = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-level"));
    const sortTalent = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-talent"));
    const sortOrb = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-orb"));
    const sortFavorite = /** @type {!HTMLButtonElement} */ (thead.querySelector(".sort-favorite"));
    const allSort = [sortID, sortForm, sortName, sortLevel, sortTalent, sortOrb, sortFavorite];

    const data = /** @type {HTMLTableSectionElement} */ (table.querySelector("tbody"));

    attachSort(sortID, idSortLambda, allSort, data);
    attachSort(sortForm, formSortLambda, allSort, data);
    attachSort(sortName, nameSortLambda, allSort, data);
    attachSort(sortLevel, levelSortLambda, allSort, data);
    attachSort(sortTalent, talentSortLambda, allSort, data);
    attachSort(sortOrb, orbSortLambda, allSort, data);
    attachSort(sortFavorite, favoriteSortLambda, allSort, data);

    assignRowSortData(data.querySelectorAll("tr"));
    sortRows(data, SORT_SETTING_ORDER[parseInt(window.localStorage.getItem("skey") ?? "0")], window.localStorage.getItem("sasc") === "Y");
}

/**
 * Attaches a click event to a button that sorts the provided row container using a provided comparator.
 * @param {HTMLButtonElement} sortTarget
 * @param {(a: HTMLTableRowElement, b: HTMLTableRowElement) => number} sort A comparator for sorting.
 * @param {HTMLButtonElement[]} allSort A list of buttons used to sort the table in some way.
 * @param {HTMLTableSectionElement} tbody The container for the sortable elements.
 */
function attachSort(sortTarget, sort, allSort, tbody) {
    sortTarget.onclick = () => {
        if(sortTarget.classList.contains("ascending")) {
            sortRows(tbody, sort, false);
            allSort.forEach((/** @type {{ classList: { remove: (arg0: string) => void; }; }} */ s) => { s.classList.remove("descending"); s.classList.remove("ascending"); });
            sortTarget.classList.add("descending");
        } else {
            sortRows(tbody, sort, true);
            allSort.forEach((/** @type {{ classList: { remove: (arg0: string) => void; }; }} */ s) => { s.classList.remove("descending"); s.classList.remove("ascending"); });
            sortTarget.classList.add("ascending");
        }
    };
}

/**
 * Sorts rows in ascending or descending order based on the provided comparator.
 * @param {HTMLTableSectionElement} tbody The table rows to sort.
 * @param {(a: HTMLTableRowElement, b: HTMLTableRowElement) => number} comparator A comparison function used to sort rows, with a negative value indicating a is above b, and a positive value the opposite.
 * @param {boolean} isAscending Whether the sort should be ascending or descending.
 */
export function sortRows(tbody, comparator, isAscending) {
    const rowMixed = [...tbody.rows];

    /** @type {HTMLTableRowElement[][]} */
    const templateArray = [];
    const rowPairs = rowMixed.reduce((prev, next) => {
        if(next.classList.contains("unit-mod-row")) {
            prev.push([next]);
        } else if(next.classList.contains("stat-mod-row")) {
            // @ts-ignore Stat rows should always come after unit rows.
            prev[prev.length - 1].push(next);
        }

        return prev;
    }, templateArray);

    rowPairs.sort((a, b) => comparator(a[0], b[0]));

    const fragment = document.createDocumentFragment();
    let flipBG = 0;
    const visualUpdate = tbody.classList.contains("legend-rare-multi") ?
        ((i) => {
            for(let x = 1; x <= 8; x++) {
                rowPairs[i][0].classList.remove(`legend-row-${x}`);
            }
            rowPairs[i][0].classList.add(`legend-row-${flipBG + 1}`);
            flipBG = ((flipBG + 1) % 8);
        }) :
        ((i) => {
            rowPairs[i][0].classList.toggle("row-bg2", flipBG === 1);
            flipBG = 1 - flipBG;
        });

    if(isAscending) {
        for(let i = 0; i < rowPairs.length; i++) {
            visualUpdate(i);
            fragment.append(...rowPairs[i]);
        }
    } else {
        for(let i = rowPairs.length - 1; i >= 0; i--) {
            visualUpdate(i);
            fragment.append(...rowPairs[i]);
        }
    }
    tbody.appendChild(fragment);
}

/**
 * Sort rows by ID, lowest to highest.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function idSortLambda(a, b) {
    return parseInt((/** @type {HTMLTableCellElement} */ (a.querySelector("td.row-id"))).innerText) - parseInt((/** @type {HTMLTableCellElement} */ (b.querySelector("td.row-id"))).innerText);
}

/**
 * Sort rows by unit form, lowest to highest.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function formSortLambda(a, b) {
    const res = parseInt(/** @type {HTMLTableCellElement} */ (b.querySelector("td.row-name")).dataset.form ?? "0") - parseInt(/** @type {HTMLTableCellElement} */ (a.querySelector("td.row-name")).dataset.form ?? "0");
    return res !== 0 ? res : idSortLambda(a, b);
}

const sorter = new Intl.Collator("en");
/**
 * Sort rows by unit name, alphabetical.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function nameSortLambda(a, b) {
    return sorter.compare((/** @type {HTMLDivElement} */ (a.querySelector("td.row-name"))).innerText.toLowerCase(), (/** @type {HTMLDivElement} */ (b.querySelector("td.row-name"))).innerText.toLowerCase());
}

/**
 * Sort rows by total unit level, lowest to highest.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function levelSortLambda(a, b) {
    const aCell = /** @type {!HTMLDivElement} */ (a.querySelector("td.row-level"));
    const bCell = /** @type {!HTMLDivElement} */ (b.querySelector("td.row-level"));
    const maxLevelA = /** @type {!HTMLInputElement} */ (aCell.querySelector(".max-level"));
    const maxLevelB = /** @type {!HTMLInputElement} */ (bCell.querySelector(".max-level"));
    const res1 = parseInt(maxLevelB?.value ?? "1") - parseInt(maxLevelA?.value ?? "1");
    if(res1 !== 0) return res1;

    const maxPlusLevelA = /** @type {!HTMLInputElement} */ (aCell.querySelector(".max-plus-level"));
    const maxPlusLevelB = /** @type {!HTMLInputElement} */ (bCell.querySelector(".max-plus-level"));
    const res2 = parseInt(maxPlusLevelB?.value ?? "0") - parseInt(maxPlusLevelA?.value ?? "0");
    return res2 !== 0 ? res2 : idSortLambda(a, b);
}

/**
 * Sort rows by number of talents upgraded, highest to lowest, prioritizing completed talents over incomplete.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function talentSortLambda(a, b) {
    const aCell = /** @type {!HTMLDivElement} */ (a.querySelector("td.row-talent"));
    const bCell = /** @type {!HTMLDivElement} */ (b.querySelector("td.row-talent"));
    const cappedCount = bCell.querySelectorAll(".maxed-talent").length - aCell.querySelectorAll(".maxed-talent").length;
    if(cappedCount !== 0) return cappedCount;

    const talentSum = [...bCell.querySelectorAll(".talent-box p")].reduce((sum, v) => sum + parseInt(v.textContent ?? "0"), 0) - [...aCell.querySelectorAll(".talent-box p")].reduce((sum, v) => sum + parseInt(v.textContent ?? "0"), 0);
    if(talentSum !== 0) return talentSum;

    const talentCount = bCell.querySelectorAll(".talent-box").length - aCell.querySelectorAll(".talent-box").length;
    return talentCount !== 0 ? talentCount : idSortLambda(a, b);
}

/**
 * Sort rows by the quality of each unit's orbs, with better coming first.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function orbSortLambda(a, b) {
    const aCell = /** @type {!HTMLDivElement} */ (a.querySelector("td.row-orb"));
    const bCell = /** @type {!HTMLDivElement} */ (b.querySelector("td.row-orb"));

    const ranksA = /** @type {HTMLImageElement[]} */ ([...aCell.querySelectorAll('.orb-selector .orb-rank')]).map(v => ORB_ORDER.indexOf(v.dataset.rank ?? ""), 0).sort();
    const ranksB = /** @type {HTMLImageElement[]} */ ([...bCell.querySelectorAll('.orb-selector .orb-rank')]).map(v => ORB_ORDER.indexOf(v.dataset.rank ?? ""), 0).sort();

    while(ranksA.length > 0 && ranksB.length > 0) {
        const rankAMax = /** @type {number} */ (ranksA.pop());
        const rankBMax = /** @type {number} */ (ranksB.pop());

        if(rankBMax - rankAMax !== 0) return rankBMax - rankAMax;
    }

    if(ranksB.length - ranksA.length !== 0) return ranksB.length - ranksA.length;

    const orbSlotCount = bCell.querySelectorAll(".orb-selector").length - aCell.querySelectorAll(".orb-selector").length;
    return orbSlotCount !== 0 ? orbSlotCount : idSortLambda(a, b);
}

/**
 * Sort rows so that favorited untis appear first.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function favoriteSortLambda(a, b) {
    const res = parseInt(/** @type {HTMLDivElement} */ (b.querySelector("td.row-favorite div")).dataset.favorited ?? "N") - parseInt(/** @type {HTMLDivElement} */ (a.querySelector("td.row-favorite div")).dataset.favorited ?? "N");
    return res !== 0 ? res : idSortLambda(a, b);
}

/**
 * Sort units by how they are sorted in game.
 * @param {HTMLTableRowElement} a
 * @param {HTMLTableRowElement} b
 */
export function gameSortLambda(a, b) {
    if(a.dataset.rarity !== b.dataset.rarity) {
        return RARITY_ORDER.indexOf(a.dataset.rarity ?? "") - RARITY_ORDER.indexOf(b.dataset.rarity ?? "");
    }

    const aMajor = parseInt(a.dataset.major_order ?? "-1");
    const aMinor = parseInt(a.dataset.minor_order ?? "-1");
    const bMajor = parseInt(b.dataset.major_order ?? "-1");
    const bMinor = parseInt(b.dataset.minor_order ?? "-1");

    if(aMajor === -1 || aMinor === -1) {
        if(bMajor === -1 || bMinor === -1) {
            return idSortLambda(a, b);
        }
        return -1;
    } else if(bMajor === -1 || bMinor === -1) {
        return 1;
    }

    if(aMajor === bMajor) {
        return aMinor - bMinor;
    }

    return aMajor - bMajor;
}

/**
 * Assigns a major ordering number and minor ordering number to each row for ordering by in-game order.
 * @param {NodeListOf<HTMLElement>} rows The rows to assign an order to.
 */
function assignRowSortData(rows) {
    rows.forEach((/** @type {HTMLElement} */ r) => {
        const id = parseInt(r.querySelector("td.row-id")?.textContent ?? "0");
        for(const [name, arr] of Object.entries(SORT_ORDER[r.dataset.rarity].categories)) {
            for(let x = 0; x < arr.length; x++) {
                if(arr[x] === id) {
                    r.dataset.major_order = `${SORT_ORDER[r.dataset.rarity].main.indexOf(name)}`;
                    r.dataset.minor_order = `${x}`;
                    return;
                }
            }
        }
        
        r.dataset.major_order = "-1";
        r.dataset.minor_order = "-1";
        console.error(`Unable to find id ${id} in sort_order.js!`);
    });
}