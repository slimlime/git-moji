// init emojisDb
const emojisDb = new JsSearch.Search('raw');
emojisDb.tokenizer = new JsSearch.StemmingTokenizer(stemmer, new JsSearch.SimpleTokenizer());
emojisDb.addIndex('raw');
emojisDb.addIndex('description');
emojisDb.addIndex('tags');

const PLACEHOLDERS = ["type some keywords...", "type what you did...", "tell me about the commit..."];
const INPUT = document.querySelector(".navSearch input");
const CACHE = document.querySelector("input#cache");
const HOMEICON = document.querySelector("nav .navIcon");
const CATALOG = document.querySelector("#catalog");
const MESSAGE = document.querySelector("#message");
const BADGE = document.querySelector("#badge");

let rank;
let maxResultsSize;
let keyupListener;

const fetchEmojis = () => {
    return fetch(new Request("emojis.json"))
        .then(emojiList => {
            if (emojiList.ok) {
                return emojiList.json()
            }

            throw new Error("Failed to fetch emojis")
        })
        .then(emojiList => {
            placeHolder(emojiList);
            processEmojis(emojiList);
        })
        .catch(error => {
            console.error(error);
        });
};

fetchEmojis();

const placeHolder = (emojiList) => {
    return document.querySelector("#placeholder span").innerHTML = twemoji.parse(emojiList[Math.floor((Math.random() * emojiList.length - 1) + 1)].unicode);
};

const clearInput = () => {
    INPUT.value = "";
};
const clearResults = () => {
    document.querySelectorAll("#searchResults .item").forEach(item => {
        item.remove()
    });
};

const showPlaceholder = () => {
    document.querySelector("#placeholder").classList.remove("hidden")
};
const hidePlaceholder = () => {
    document.querySelector("#placeholder").classList.add("hidden")
};

const showMessage = () => {
    MESSAGE.classList.remove("hidden");
};
const hideMessage = () => {
    MESSAGE.classList.add("hidden");
};

const showCatalog = () => {
    CATALOG.classList.remove("hidden");
};
const hideCatalog = () => {
    CATALOG.classList.add("hidden");
};

const addCatalogAlpha = () => {
    CATALOG.classList.add("alpha");
};
const removeCatalogAlpha = () => {
    CATALOG.classList.remove("alpha");
};

const focusInput = () => {
    INPUT.focus();
};

const toggleBadge = () => {
    BADGE.classList.add("active");
    setTimeout(() => {
        BADGE.classList.remove("active");
    }, 1200);
};

const appendResultItem = (emoji, destination) => {
    let baseItem = `<div class="item card"><div class="unicode">${twemoji.parse(emoji.unicode)}</div><div class="wrapper"><div class="raw">${emoji.raw}</div><div class="description">${emoji.description}</div></div></div>`;
    document.querySelector(destination).insertAdjacentHTML('beforeend', baseItem);
};

document.querySelector(".navSearch").addEventListener("click", () => {
    hidePlaceholder();
});

/*
 starting to listen for input after 300ms to prevent hiding
 the placeholder because of the shortcut
 */
setTimeout(() => {
    INPUT.addEventListener("keyup", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            return;
        }

        if (event.key === "Enter") {
            return;
        }

        rank = 0;
        let results = emojisDb.search(INPUT.value);

        processResults(results);

        if (INPUT.value.length === 0) {
            removeCatalogAlpha();
            hideMessage();
            showPlaceholder();
            return;
        }

        hidePlaceholder();
    });
}, 300);

const processResults = (results) => {
    document.removeEventListener("keyup", keyupListener);
    clearResults();

    if (results.length === 0) {
        addCatalogAlpha();
        showCatalog();
        showMessage();
        return;
    }
    removeCatalogAlpha();
    hideCatalog();
    hideMessage();

    results.forEach(item => {
        appendResultItem(item, "#searchResults");
    });

    maxResultsSize = results;
    keyupListener = document.addEventListener('keyup', keyManagement);
};

const keyManagement = (event) => {
    if (event.key === "ArrowDown") {
        if (rank + 1 <= maxResultsSize.length - 1) {
            rank = rank + 1;
        }
    }

    if (event.key === "ArrowUp") {
        if (rank - 1 >= 0) {
            rank = rank - 1;
        }
    }

    if (event.key === "Enter") {
        copyEmoji(document.querySelectorAll('#searchResults .item')[rank].querySelector('.wrapper .raw').innerText);
    }

    if (document.querySelector('#searchResults .item.hover')) {
        document.querySelector('#searchResults .item.hover').classList.remove("hover");
    }

    if (document.querySelectorAll('#searchResults .item')[rank]) {
        document.querySelectorAll('#searchResults .item')[rank].classList.add("hover");
    }
};

const processEmojis = (emojiList) => {
    emojisDb.addDocuments(emojiList);
    emojiList.forEach(item => {
        appendResultItem(item, "#catalog");
    });
    INPUT.removeAttribute("disabled");
    focusInput();
};

const copyEmoji = (emoji) => {
    CACHE.value = emoji;
    CACHE.select();
    document.execCommand('copy');
    toggleBadge();
};

document.addEventListener('DOMContentLoaded', () => {
    INPUT.placeholder = PLACEHOLDERS[Math.floor((Math.random() * PLACEHOLDERS.length - 1) + 1)];
    document.querySelector("#badge span").innerHTML = `Copied ${twemoji.parse("🎉")}`;
});

HOMEICON.addEventListener("click", () => {
    clearInput();
    clearResults();
    removeCatalogAlpha();
    showCatalog();
    hideMessage();
    showPlaceholder();
    focusInput();
});

document.querySelector("body").addEventListener("click", (event) => {
    let emoji;

    switch (event.target.className) {
        case "item card" : {
            emoji = event.target.querySelector('.wrapper .raw').innerText;
            break;
        }
        case "description" : {
            emoji = event.target.parentNode.querySelector('.raw').innerText;
            break;
        }
        case "unicode" : {
            emoji = event.target.parentNode.querySelector('.wrapper .raw').childNodes[0].innerText;
            break;
        }
        case "raw" : {
            emoji = event.target.innerText;
            break;
        }
        default : {
            emoji = false;
        }
    }

    if (!emoji) {
        return;
    }

    copyEmoji(emoji);
});
