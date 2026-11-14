
/* =====================================
   DEAR DIARY — JAVASCRIPT
===================================== */

// Store diary entries
let entries = JSON.parse(localStorage.getItem("dearDiaryEntries")) || [];

// Currently selected mood
let selectedMood = "";

// SAVE ENTRIES TO LOCAL STORAGE
function saveToStorage() {
    localStorage.setItem("dearDiaryEntries", JSON.stringify(entries));
}

// DATE AND TIME
function updateDateTime() {
    const now = new Date();

    const dateElement = document.getElementById("current-date");
    const timeElement = document.getElementById("current-time");

    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);


// OPEN WRITING ROOM
function showWritingRoom() {
    document.getElementById("write").scrollIntoView({
        behavior: "smooth"
    });

    document.getElementById("entry-title").focus();
}


// SELECT A MOOD
function setMood(mood) {
    selectedMood = mood;

    document.querySelectorAll(".mood").forEach(button => {
        button.classList.remove("selected");

        if (button.getAttribute("onclick") === `setMood('${mood}')`) {
            button.classList.add("selected");
        }
    });
}


// SAVE A DIARY ENTRY
function saveEntry() {
    const title = document.getElementById("entry-title").value.trim();
    const content = document.getElementById("entry-content").value.trim();

    if (!title || !content) {
        alert("Give your memory a title and write something first. ♡");
        return;
    }

    if (!selectedMood) {
        alert("Choose how you're feeling today. ♡");
        return;
    }

    const entry = {
        id: Date.now(),
        title: title,
        content: content,
        mood: selectedMood,
        date: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        favourite: false
    };

    entries.unshift(entry);

    saveToStorage();

    document.getElementById("entry-title").value = "";
    document.getElementById("entry-content").value = "";

    selectedMood = "";

    document.querySelectorAll(".mood").forEach(button => {
        button.classList.remove("selected");
    });

    updateDashboard();

    alert("Your memory has been saved. ♡");
}


// DISPLAY MEMORIES
function displayEntries(list = entries) {
    const container = document.getElementById("entrieslist");

    if (!container) return;

    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p>No memories here yet. Start writing your story. ♡</p>";
        return;
    }

    list.forEach(entry => {
        const card = document.createElement("div");
        card.className = "entry-card";

        const title = document.createElement("h3");
        title.textContent = entry.title;

        const date = document.createElement("small");
        date.textContent = `${entry.date} · ${entry.mood}`;

        const content = document.createElement("p");
        content.textContent = entry.content;

        const favouriteButton = document.createElement("button");
        favouriteButton.textContent = entry.favourite ? "♥ Favourite" : "♡ Favourite";
        favouriteButton.onclick = () => toggleFavourite(entry.id);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteEntry(entry.id);

        card.append(title, date, content, favouriteButton, deleteButton);
        container.appendChild(card);
    });
}


// FAVOURITE A MEMORY
function toggleFavourite(id) {
    const entry = entries.find(item => item.id === id);

    if (!entry) return;

    entry.favourite = !entry.favourite;

    saveToStorage();
    updateDashboard();
}


// DELETE A MEMORY
function deleteEntry(id) {
    if (!confirm("Are you sure you want to delete this memory?")) {
        return;
    }

    entries = entries.filter(entry => entry.id !== id);

    saveToStorage();
    updateDashboard();
}


// SEARCH MEMORIES
const searchInput = document.getElementById("searchEntries");

if (searchInput) {
    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();

        const filteredEntries = entries.filter(entry =>
            entry.title.toLowerCase().includes(searchTerm) ||
            entry.content.toLowerCase().includes(searchTerm) ||
            entry.mood.toLowerCase().includes(searchTerm)
        );

        displayEntries(filteredEntries);
    });
}


// UPDATE DASHBOARD STATISTICS
function updateDashboard() {
    document.getElementById("entry-count").textContent = entries.length;

    document.getElementById("favourite-count").textContent =
        entries.filter(entry => entry.favourite).length;

    const days = new Set(
        entries.map(entry => new Date(entry.timestamp).toDateString())
    );

    document.getElementById("daycount").textContent = days.size;

    displayEntries();
    displayMoodHistory();
}


// DISPLAY MOOD HISTORY
function displayMoodHistory() {
    const container = document.getElementById("moodHistory");

    if (!container) return;

    container.innerHTML = "";

    if (entries.length === 0) {
        container.textContent = "Your mood journey will appear here. ♡";
        return;
    }

    const moodCounts = {};

    entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    Object.entries(moodCounts).forEach(([mood, count]) => {
        const row = document.createElement("p");
        row.textContent = `${mood}: ${count} ${count === 1 ? "entry" : "entries"}`;

        container.appendChild(row);
    });
}


// LOAD EVERYTHING WHEN PAGE OPENS
updateDashboard();


/* =====================================
   DEAR DIARY — PHOTO GALLERY
   IndexedDB permanent browser storage
===================================== */

let galleryDB;
let photoURLs = [];

// OPEN THE PHOTO DATABASE
function openGalleryDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("DearDiaryGallery", 1);

        request.onupgradeneeded = function () {
            const db = request.result;

            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos", {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = function () {
            galleryDB = request.result;
            resolve(galleryDB);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}


// SAVE A PHOTO
function savePhoto(photo) {
    return new Promise((resolve, reject) => {
        const transaction = galleryDB.transaction("photos", "readwrite");

        transaction.objectStore("photos").add(photo);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}


// GET ALL PHOTOS
function getPhotos() {
    return new Promise((resolve, reject) => {
        const transaction = galleryDB.transaction("photos", "readonly");
        const request = transaction.objectStore("photos").getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}


// DELETE A PHOTO
function removePhoto(id) {
    return new Promise((resolve, reject) => {
        const transaction = galleryDB.transaction("photos", "readwrite");

        transaction.objectStore("photos").delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}


// DISPLAY THE GALLERY
async function displayGallery() {
    const gallery = document.getElementById("photo-gallery");

    if (!gallery || !galleryDB) return;

    // Clean up old image previews
    photoURLs.forEach(url => URL.revokeObjectURL(url));
    photoURLs = [];

    gallery.innerHTML = "";

    try {
        const photos = await getPhotos();

        if (photos.length === 0) {
            gallery.innerHTML =
                '<p class="gallery-empty">Your memories will find a home here. ♡</p>';
            return;
        }

        photos.sort((a, b) => b.timestamp - a.timestamp);

        photos.forEach(photo => {
            const card = document.createElement("div");
            card.className = "photo-card";

            const image = document.createElement("img");
            const imageURL = URL.createObjectURL(photo.image);

            photoURLs.push(imageURL);

            image.src = imageURL;
            image.alt = photo.caption || "A saved memory";

            const caption = document.createElement("p");
            caption.className = "photo-caption";
            caption.textContent = photo.caption || "Untitled memory ♡";

            const date = document.createElement("small");
            date.textContent = new Date(photo.timestamp).toLocaleDateString();

            date.style.display = "block";
            date.style.padding = "0 12px 12px";
            date.style.color = "#99968d";
            date.style.fontSize = "10px";

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete photo";

            deleteButton.onclick = async function () {
                if (!confirm("Delete this photograph?")) return;

                try {
                    await removePhoto(photo.id);
                    displayGallery();
                } catch (error) {
                    alert("Could not delete this photo.");
                }
            };

            card.append(image, caption, date, deleteButton);
            gallery.appendChild(card);
        });

    } catch (error) {
        console.error("Gallery loading error:", error);
        gallery.innerHTML =
            '<p class="gallery-empty">Could not load your photographs.</p>';
    }
}


// UPLOAD PHOTOGRAPHS
const photoInput = document.getElementById("photo-upload");

if (photoInput) {
    photoInput.addEventListener("change", async function () {

        const files = Array.from(this.files);

        if (!galleryDB) {
            alert("Your gallery is still loading. Please try again.");
            this.value = "";
            return;
        }

        for (const file of files) {

            if (!file.type.startsWith("image/")) continue;

            const caption = prompt(
                "Give this photograph a little caption:",
                file.name.replace(/\.[^/.]+$/, "")
            );

            const photo = {
                id: crypto.randomUUID(),
                image: file,
                caption: caption === null ? "" : caption.trim(),
                timestamp: Date.now()
            };

            try {
                await savePhoto(photo);
            } catch (error) {
                console.error(error);
                alert("Could not save this photograph. Your browser storage may be full.");
                break;
            }
        }

        this.value = "";
        await displayGallery();
    });
}


// START THE GALLERY
async function initializeGallery() {
    try {
        await openGalleryDB();
        await displayGallery();
    } catch (error) {
        console.error("Could not open photo database:", error);

        const gallery = document.getElementById("photo-gallery");

        if (gallery) {
            gallery.textContent = "Your gallery could not be opened.";
        }
    }
}

initializeGallery();


/* =====================================
   DEAR DIARY — CALENDAR
===================================== */

// Save calendar events
let calendarEvents =
    JSON.parse(localStorage.getItem("dearDiaryEvents")) || [];

let calendarDate = new Date();
let selectedCalendarDate = new Date();

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function saveCalendarEvents() {
    localStorage.setItem(
        "dearDiaryEvents",
        JSON.stringify(calendarEvents)
    );
}

// Display calendar
function renderCalendar() {
    const monthDisplay = document.getElementById("calendar-month");
    const daysContainer = document.getElementById("calendar-days");

    if (!monthDisplay || !daysContainer) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    monthDisplay.textContent = calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    daysContainer.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const todayKey = getDateKey(new Date());
    const selectedKey = getDateKey(selectedCalendarDate);

    // Empty spaces before the first day
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        daysContainer.appendChild(empty);
    }

    // Create the dates
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const dateKey = getDateKey(date);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        button.textContent = day;

        if (dateKey === todayKey) {
            button.classList.add("today");
        }

        if (dateKey === selectedKey) {
            button.classList.add("selected");
        }

        if (calendarEvents.some(event => event.date === dateKey)) {
            button.classList.add("has-event");
        }

        button.onclick = function () {
            selectedCalendarDate = date;
            renderCalendar();
            displaySelectedEvents();
        };

        daysContainer.appendChild(button);
    }

    displaySelectedEvents();
}


// Show events for selected date
function displaySelectedEvents() {
    const heading = document.getElementById("selected-date");
    const container = document.getElementById("event-list");

    if (!heading || !container) return;

    const dateKey = getDateKey(selectedCalendarDate);

    heading.textContent = selectedCalendarDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    container.innerHTML = "";

    const events = calendarEvents.filter(
        event => event.date === dateKey
    );

    if (events.length === 0) {
        container.textContent = "Nothing planned for this day. ♡";
        return;
    }

    events.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";

        const info = document.createElement("div");

        const title = document.createElement("strong");
        title.textContent = event.title;

        const type = document.createElement("small");
        type.textContent = event.type;

        info.append(title, type);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.onclick = function () {
            if (!confirm("Delete this event?")) return;

            calendarEvents = calendarEvents.filter(
                item => item.id !== event.id
            );

            saveCalendarEvents();
            renderCalendar();
        };

        card.append(info, deleteButton);
        container.appendChild(card);
    });
}


// Previous month
document.getElementById("prev-month").onclick = function () {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
};


// Next month
document.getElementById("next-month").onclick = function () {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
};


// Add an event
document.getElementById("add-event").onclick = function () {
    const titleInput = document.getElementById("event-title");
    const typeInput = document.getElementById("event-type");

    const title = titleInput.value.trim();

    if (!title) {
        alert("Give your event a name first. ♡");
        return;
    }

    calendarEvents.push({
        id: Date.now() + Math.random(),
        title: title,
        type: typeInput.value,
        date: getDateKey(selectedCalendarDate)
    });

    saveCalendarEvents();

    titleInput.value = "";

    renderCalendar();

    alert("Your date has been saved. ♡");
};


// Start calendar
renderCalendar();

// PERSONALIZED GREETING

function updateGreeting() {
    const hour = new Date().getHours();
    const greeting = document.getElementById("welcome-greeting");

    if (!greeting) return;

    let message;

    if (hour < 12) {
        message = "Good morning,";
    } else if (hour < 17) {
        message = "Good afternoon,";
    } else if (hour < 21) {
        message = "Good evening,";
    } else {
        message = "Good night,";
    }

    greeting.innerHTML = `${message} <span>Rae.</span>`;
}

updateGreeting();

// BUCKET LIST

let bucketItems = JSON.parse(localStorage.getItem("dearDiaryBucket")) || [];

function saveBucketList() {
    localStorage.setItem("dearDiaryBucket", JSON.stringify(bucketItems));
}

function displayBucketList() {
    const container = document.getElementById("bucket-list");
    const count = document.getElementById("bucket-count");
    const progressBar = document.getElementById("bucket-progress-bar");

    if (!container) return;

    container.innerHTML = "";

    if (bucketItems.length === 0) {
        container.innerHTML = '<p class="gallery-empty">Your dreams belong here. ♡</p>';
    }

    bucketItems.forEach(item => {
        const div = document.createElement("div");
        div.className = item.completed ? "bucket-item completed" : "bucket-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.completed;

        checkbox.onchange = function () {
            item.completed = checkbox.checked;
            saveBucketList();
            displayBucketList();
        };

        const text = document.createElement("span");
        text.textContent = item.text;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.title = "Delete item";

        deleteButton.onclick = function () {
            bucketItems = bucketItems.filter(entry => entry.id !== item.id);
            saveBucketList();
            displayBucketList();
        };

        div.append(checkbox, text, deleteButton);
        container.appendChild(div);
    });

    const completed = bucketItems.filter(item => item.completed).length;
    const percentage = bucketItems.length
        ? (completed / bucketItems.length) * 100
        : 0;

    count.textContent = `${completed} of ${bucketItems.length} things completed`;
    progressBar.style.width = percentage + "%";
}

document.getElementById("add-bucket").addEventListener("click", function () {
    const input = document.getElementById("bucket-input");
    const text = input.value.trim();

    if (text === "") {
        alert("Write something you want to do first!");
        return;
    }

    bucketItems.push({
        id: Date.now() + Math.random(),
        text: text,
        completed: false
    });

    saveBucketList();
    input.value = "";
    displayBucketList();
});

document.getElementById("bucket-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        document.getElementById("add-bucket").click();
    }
});

displayBucketList();

// LITTLE WINS

let littleWins = JSON.parse(localStorage.getItem("dearDiaryWins")) || [];

function saveWins() {
    localStorage.setItem("dearDiaryWins", JSON.stringify(littleWins));
}

function displayWins() {
    const container = document.getElementById("wins-list");

    if (!container) return;

    container.innerHTML = "";

    if (littleWins.length === 0) {
        container.innerHTML =
            '<p class="gallery-empty">Your little victories will live here. ♡</p>';
        return;
    }

    littleWins.forEach(win => {
        const card = document.createElement("div");
        card.className = "win-card";

        const star = document.createElement("div");
        star.className = "win-star";
        star.textContent = "✧";

        const text = document.createElement("p");
        text.textContent = win.text;

        const date = document.createElement("small");
        date.textContent = win.date;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.title = "Delete win";

        deleteButton.onclick = function () {
            littleWins = littleWins.filter(item => item.id !== win.id);
            saveWins();
            displayWins();
        };

        card.append(star, text, date, deleteButton);
        container.appendChild(card);
    });
}

document.getElementById("add-win").addEventListener("click", function () {
    const input = document.getElementById("win-input");
    const text = input.value.trim();

    if (text === "") {
        alert("Come on, give yourself some credit! ♡");
        return;
    }

    littleWins.unshift({
        id: Date.now() + Math.random(),
        text: text,
        date: new Date().toLocaleDateString()
    });

    saveWins();
    input.value = "";
    displayWins();
});

document.getElementById("win-input").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        document.getElementById("add-win").click();
    }
});

displayWins();





/* =================================
   DEAR DIARY — APPEARANCE STUDIO
================================= */


const builtInThemes = [
    // DARK THEMES
    ["Midnight", "#111110", "#bba985", "#eee9dd"],
    ["Purple Haze", "#10091f", "#a855f7", "#f1e8ff"],
    ["Black Amethyst", "#09070f", "#8b5cf6", "#e9ddff"],
    ["Neon Violet", "#10051c", "#d946ef", "#fce7ff"],
    ["Cyberpunk", "#080b18", "#00e5ff", "#e5fbff"],
    ["Blood Moon", "#160609", "#dc2626", "#ffe4e6"],
    ["Crimson Night", "#12070c", "#f43f5e", "#ffe4e9"],
    ["Emerald Shadow", "#06130e", "#10b981", "#dcfce7"],
    ["Toxic Green", "#080f08", "#a3e635", "#f0fce0"],
    ["Ocean Abyss", "#06111e", "#0ea5e9", "#e0f2fe"],
    ["Royal Blue", "#080d24", "#6366f1", "#e0e7ff"],
    ["Dark Cherry", "#190711", "#be185d", "#fce7f3"],
    ["Cyber Orange", "#171008", "#f97316", "#ffedd5"],
    ["Gothic Silver", "#101014", "#a1a1aa", "#f4f4f5"],
    ["Dark Teal", "#061616", "#14b8a6", "#ccfbf1"],
    ["Golden Hour", "#181006", "#eab308", "#fef9c3"],
    ["Cosmic Pink", "#17091b", "#ec4899", "#fce7f3"],
    ["Dark Sapphire", "#070d1c", "#2563eb", "#dbeafe"],

    // LIGHT THEMES
    ["Lavender Dream", "#eee7ff", "#7c3aed", "#25143e"],
    ["Cotton Candy", "#ffe4f1", "#db2777", "#45152e"],
    ["Arctic Blue", "#e0f2fe", "#0284c7", "#082f49"],
    ["Mint Fresh", "#d1fae5", "#059669", "#064e3b"],
    ["Cherry Blossom", "#fce7f3", "#be185d", "#500724"],
    ["Sunflower", "#fef3c7", "#d97706", "#451a03"],
    ["Peach Pop", "#ffedd5", "#ea580c", "#431407"],
    ["Electric Lilac", "#ede9fe", "#9333ea", "#2e1065"],
    ["Aqua Splash", "#ccfbf1", "#0f766e", "#042f2e"],
    ["Rose Quartz", "#fce4ec", "#c2185b", "#4a1028"],
    ["Lemon Pop", "#fef9c3", "#ca8a04", "#422006"],
    ["Sky Violet", "#e0e7ff", "#4f46e5", "#1e1b4b"],
    ["Coral Reef", "#ffe4e6", "#e11d48", "#4c0519"],
    ["Jade", "#dcfce7", "#15803d", "#052e16"]
].map(([name, background, accent, text]) => ({
    id: name,
    name,
    background,
    accent,
    text
}));


let customThemes = JSON.parse(
    localStorage.getItem("dearDiaryCustomThemes")
) || [];

function createPalette(theme) {
    return {
        background: theme.background,
        sidebar: `color-mix(in srgb, ${theme.background} 88%, white)`,
        panel: `color-mix(in srgb, ${theme.background} 84%, white)`,
        panelLight: `color-mix(in srgb, ${theme.background} 78%, white)`,
        ivory: theme.text,
        text: theme.text,
        muted: `color-mix(in srgb, ${theme.text} 65%, ${theme.background})`,
        soft: `color-mix(in srgb, ${theme.text} 82%, ${theme.background})`,
        gold: theme.accent,
        goldLight: `color-mix(in srgb, ${theme.accent} 70%, white)`,
        border: `color-mix(in srgb, ${theme.accent} 18%, transparent)`,
        inputBg: `color-mix(in srgb, ${theme.background} 92%, black)`,
        buttonText: theme.background
    };
}

function applyTheme(theme) {
    const palette = createPalette(theme);
    const root = document.documentElement;

    Object.entries(palette).forEach(([variable, value]) => {
        const cssName = "--" + variable.replace(
            /[A-Z]/g,
            letter => "-" + letter.toLowerCase()
        );

        root.style.setProperty(cssName, value);
    });

    localStorage.setItem(
        "dearDiaryAppearance",
        JSON.stringify(theme)
    );

    document.querySelectorAll(".theme-card").forEach(card => {
        card.classList.toggle(
            "active",
            card.dataset.themeId === theme.id
        );
    });
}

function renderThemes() {
    const grid = document.getElementById("theme-grid");

    if (!grid) return;

    grid.innerHTML = "";

    const allThemes = [...builtInThemes, ...customThemes];

    allThemes.forEach(theme => {
        const card = document.createElement("div");
        card.className = "theme-card";
        card.dataset.themeId = theme.id;
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        const preview = document.createElement("div");
        preview.className = "theme-preview";

        [theme.background, theme.accent, theme.text].forEach(color => {
            const swatch = document.createElement("span");
            swatch.style.background = color;
            preview.appendChild(swatch);
        });

        const name = document.createElement("p");
        name.textContent = theme.name;

        card.append(preview, name);

        card.addEventListener("click", () => applyTheme(theme));

        card.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                applyTheme(theme);
            }
        });

        grid.appendChild(card);
    });
}

// SAVE A CUSTOM PALETTE

const saveCustomTheme = document.getElementById("save-custom-theme");

if (saveCustomTheme) {
    saveCustomTheme.addEventListener("click", () => {
        const name = prompt("Give your new palette a name:");

        if (!name || !name.trim()) return;

        const theme = {
            id: "custom-" + Date.now(),
            name: name.trim(),
            background: document.getElementById("custom-background").value,
            accent: document.getElementById("custom-accent").value,
            text: document.getElementById("custom-text").value
        };

        customThemes.push(theme);

        localStorage.setItem(
            "dearDiaryCustomThemes",
            JSON.stringify(customThemes)
        );

        renderThemes();
        applyTheme(theme);

        alert("Your custom palette has been saved. ♡");
    });
}

// LOAD THE APPEARANCE STUDIO

renderThemes();

const savedTheme = JSON.parse(
    localStorage.getItem("dearDiaryAppearance")
);

const defaultTheme = builtInThemes[0];

const initialTheme = savedTheme || defaultTheme;

applyTheme(initialTheme);
