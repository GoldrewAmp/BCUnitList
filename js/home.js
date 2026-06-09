//@ts-check
import SPLASH_TEXT from "../assets/random-splash.js";
import SETTINGS from "../assets/settings.js";

document.addEventListener("DOMContentLoaded", () => {
    const sidebarTabs = /** @type {HTMLDivElement[]} */ [...document.querySelectorAll(".sidebar-section")];
    const contentTabs = /** @type {HTMLDivElement[]} */ [...document.querySelectorAll("#home-content-wrapper .content-section")];

    //@ts-ignore Why does ts not allow click events on generic elements?
    sidebarTabs[1].onclick = () => {
        contentTabs.forEach(t => t.classList.add("hidden"));
        randomizeSplash();
        contentTabs[0].classList.remove("hidden");
    };

    for(let x = 2; x < sidebarTabs.length; x++) {
        //@ts-ignore
        sidebarTabs[x].onclick = () => {
            contentTabs.forEach(t => t.classList.add("hidden"));
            contentTabs[x - 1].classList.remove("hidden");
        };
    }

    initializePages();
});

function randomizeSplash() {
    const splashContainer = /** @type {HTMLDivElement} */ (document.querySelector("#home-splash"));

    const dateCheck = new Date().getDate();
    const beatITF3 = window.localStorage.getItem("bhtf") === "1";
    const noFlowerTF = window.localStorage.getItem("bloom") !== "1";
    if((dateCheck === 21 || dateCheck === 1) && beatITF3 && noFlowerTF) {
        splashContainer.textContent = SPLASH_TEXT["22t"];
        return;
    } else if((dateCheck === 22 || dateCheck === 2) && beatITF3 && noFlowerTF) {
        splashContainer.textContent = SPLASH_TEXT["22"];
        return;
    }

    const previousTextContent = splashContainer.textContent;
    const rand = Math.random();
    if(rand < 0.7) {
        while(splashContainer.textContent === previousTextContent) {
            splashContainer.textContent = SPLASH_TEXT.common[Math.floor(Math.random() * SPLASH_TEXT.common.length)];
        }
    } else if(rand < 0.9995) {
        while(splashContainer.textContent === previousTextContent) {
            splashContainer.textContent = SPLASH_TEXT.uncommon[Math.floor(Math.random() * SPLASH_TEXT.uncommon.length)];
        }
    } else {
        while(splashContainer.textContent === previousTextContent) {
            splashContainer.textContent = SPLASH_TEXT.rare[Math.floor(Math.random() * SPLASH_TEXT.rare.length)];
        }
    }
}

function initializePages() {
    //@ts-ignore
    document.querySelector("#home-cat-quote").onclick = () => {
        randomizeSplash();
    };
    randomizeSplash();

    /** @type {HTMLSpanElement} */ (document.querySelector("#home-update-ver")).textContent = SETTINGS.gameVersion;
}