//@ts-check
import createArrowNumberBox from "./arrow-box.js";
import SETTINGS from "../../assets/settings.js";

/**
 * @readonly
 * @enum {number}
 */
const BASE_PARTS = {
    CANNON: 0,
    STYLE: 1,
    FOUNDATION: 2
}

/**
 * Creates elements to enter the levels of each base part for each base type.
 */
export default function loadCannonInfo() {
    const wrapper = document.querySelector("#cat-base-selector");
    const defaultCannon = createBaseStyling(SETTINGS.ototo.names[0], SETTINGS.ototo.cannon, SETTINGS.ototo.base, SETTINGS.ototo.style, 1);
    defaultCannon.querySelector("label[data-input-type='0']")?.classList.add("hidden");
    defaultCannon.querySelector("label[data-input-type='1']")?.classList.add("hidden");
    wrapper?.appendChild(defaultCannon);
    for(let x = 2; x <= SETTINGS.ototo.names.length; x++) {
        wrapper?.appendChild(createBaseStyling(SETTINGS.ototo.names[x - 1], SETTINGS.ototo.cannon, SETTINGS.ototo.base, SETTINGS.ototo.style, x));
    }
}

/**
 * Create an input for each component of a base for a given base type.
 * @param {string} name The name of the base type.
 * @param {number} cannonCap The level cap on the base type's cannon.
 * @param {number} baseCap The level cap on the base type's foundation.
 * @param {number} styleCap The level cap on the base type's style.
 * @param {number} id The "ID" corresponding to the position of the base type in the list of base types in the settings object.
 * @returns {HTMLDivElement} An element that controls all of the inputs for a specific base type.
 */
function createBaseStyling(name, cannonCap, baseCap, styleCap, id) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("cannon-info");
    wrapper.classList.add("v-align");

    const title = document.createElement("h4");
    title.textContent = name;

    const componentWrapper = document.createElement("div");
    componentWrapper.classList.add("h-align");

    const imageWrapper = document.createElement("div");
    imageWrapper.classList.add("base-image");

    const cannonImage = document.createElement("img");
    cannonImage.classList.add("cannon-image");
    cannonImage.src = `./assets/img/foundation/base_${id}.png`;
    cannonImage.style.zIndex = "1";

    const styleImage = document.createElement("img");
    styleImage.classList.add("style-image");
    styleImage.src = `./assets/img/foundation/base_${id}_style.png`;
    styleImage.style.zIndex = "2";

    const foundationImage = document.createElement("img");
    foundationImage.classList.add("foundation-image");
    foundationImage.src = `./assets/img/foundation/base_${id}_foundation.png`;
    foundationImage.style.zIndex = "0";

    imageWrapper.append(cannonImage, styleImage, foundationImage);

    const valueWrapper = document.createElement("div");
    valueWrapper.classList.add("base-values");

    const currentValues = window.localStorage.getItem(`oo_${id}`)?.split("-") ?? ["0", "0", "0"];

    valueWrapper.append(
        createBaseValueInput(cannonCap, parseInt(currentValues[0]), BASE_PARTS.CANNON, id),
        createBaseValueInput(styleCap, parseInt(currentValues[1]), BASE_PARTS.STYLE, id),
        createBaseValueInput(baseCap, parseInt(currentValues[2]), BASE_PARTS.FOUNDATION, id)
    );
    componentWrapper.append(imageWrapper, valueWrapper);
    wrapper.append(title, componentWrapper);

    return wrapper;
}

/**
 * Creates an element for inputting a cannon, style, or foundation level.
 * @param {number} cap The maximum value of the input.
 * @param {number} currentValue The initial value of the input.
 * @param {BASE_PARTS} type What part of the base this input is for.
 * @param {number} id An "ID" corresponding to the index of the base type this input is for in the list of base types contained in the settings.
 * @returns {HTMLLabelElement} A label element that labels the base value input.
 */
function createBaseValueInput(cap, currentValue, type, id) {
    const valueLabel = document.createElement("label");
    valueLabel.classList.add("h-align");
    valueLabel.dataset.inputType = `${type}`;

    const labelText = document.createElement("p");
    switch(type) {
        case 0:
            labelText.textContent = "Cannon";
            break;
        case 1:
            labelText.textContent = "Style";
            break;
        case 2:
            labelText.textContent = "Foundation";
            break;
        default:
            labelText.textContent = "Undefined part of base";
            break;
    }
    
    const [labelInput, inputElm] = createArrowNumberBox(cap, currentValue, () => {
        const currentValues = window.localStorage.getItem(`oo_${id}`)?.split("-") ?? ["0", "0", "0"];
        currentValues[type] = inputElm.value;
        window.localStorage.setItem(`oo_${id}`, currentValues.join("-"));
    }, id === 1 ? 1 : 0); // Min is set to 1 for default base because it starts at level 1 foundation

    valueLabel.append(labelText, labelInput);
    return valueLabel;
}