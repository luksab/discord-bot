"use strict";

var WSLib;

function fillTable(questions) {
    let table = document.getElementById("questionBody");
    while (table.firstChild) {
        table.removeChild(table.lastChild);
    }

    let fragment = document.createDocumentFragment();
    let tr, td, input, select, option;

    const options = ["s", "q", "e"];
    for (const question of questions) {
        tr = document.createElement("tr");
        td = document.createElement("td");
        input = document.createElement("input");
        input.value = question.question;
        input.style.width = "100%";
        td.appendChild(input);
        tr.appendChild(td);
        select = document.createElement("select");

        options.forEach((o) => {
            option = document.createElement("option");
            option.text = o;
            select.appendChild(option);
        });
        select.selectedIndex = options.indexOf(question.explicitness);

        td = document.createElement("td");
        td.appendChild(select);
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = `<button data-id="${question.id}">save</button>
        <button data-id="${question.id}">delete</button>`;
        tr.appendChild(td);

        fragment.appendChild(tr);
    }
    {// add empty question at the end
        tr = document.createElement("tr");
        td = document.createElement("td");
        input = document.createElement("input");
        input.value = "";
        input.style.width = "100%";
        td.appendChild(input);
        tr.appendChild(td);
        select = document.createElement("select");

        options.forEach((o) => {
            option = document.createElement("option");
            option.text = o;
            select.appendChild(option);
        });
        select.selectedIndex = options.indexOf("s");

        td = document.createElement("td");
        td.appendChild(select);
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = `<button data-id="new">add</button>`;
        tr.appendChild(td);

        fragment.appendChild(tr);
    }
    table.appendChild(fragment)

}

function fillGuilds(guilds) {
    let guildSelector = document.getElementById("guildSelector");
    while (guildSelector.firstChild) {
        guildSelector.removeChild(guildSelector.lastChild);
    }
    let fragment = document.createDocumentFragment();

    let option;

    guilds.unshift({ guildid: "global", name: "global" }, { guildid: "private", name: "private" });

    for (const guild of guilds) {
        option = document.createElement("option");
        option.value = guild.guildid;
        option.innerText = guild.name;
        fragment.appendChild(option);
    }
    guildSelector.appendChild(fragment);
}

async function fillCategories(categories) {
    let categorySelector = document.getElementById("categorySelector");
    while (categorySelector.firstChild) {
        categorySelector.removeChild(categorySelector.lastChild);
    }
    let fragment = document.createDocumentFragment();
    console.log(categories)
    let wasEmpty = !categories.length;

    categories.push({ category: "add new" });

    let option;
    for (const category of categories) {
        option = document.createElement("option");
        option.value = category.category;
        option.innerText = category.category;
        fragment.appendChild(option);
    }
    categorySelector.appendChild(fragment);


    if (wasEmpty)
        categorySelector.value = "select category"

    updateRows();

}

document.addEventListener("DOMContentLoaded", () => {
    let table = document.getElementById("questionBody");
    table.addEventListener("click", async e => {
        let id = e.target.getAttribute("data-id")
        if (id) {
            e.stopPropagation();
            if (e.target.innerText == "save") {
                console.log("clicked on save for", id);
                let question = { id: id };
                question.question = e.target.parentNode.parentNode.querySelector("input").value;
                question.explicitness = e.target.parentNode.parentNode.querySelector("select").value;
                if (question.question && question.explicitness && question.id) {
                    await WSLib.send("updateQuestion", question);
                    updateRows();
                    return false;
                } else {
                    window.alert("something went wrong... reload the page maybe?");
                }
            } else if (e.target.innerText === "add") {
                console.log("clicked on save for", id);
                let question = { id: id };
                question.question = e.target.parentNode.parentNode.querySelector("input").value;
                question.explicitness = e.target.parentNode.parentNode.querySelector("select").value;
                question.category = categorySelector.value;
                question.guild = guildSelector.value;
                if (question.category && question.question && question.explicitness && question.guild) {
                    await WSLib.send("addQuestion", question);
                    updateRows();
                    return false;
                } else {
                    window.alert("something went wrong... reload the page maybe?");
                }
            }
            else if (e.target.innerText == "delete") {
                console.log("clicked on delete for", id);
                if (confirm('Are you sure you want to delete the question "' + e.target.parentNode.parentNode.querySelector("input").value + '"?')) {
                    await WSLib.send("deleteQuestion", { id: id });
                    updateRows();
                }
                return false;
            }
            else {
                console.log(e.target.innerText);
            }
        }
    });

    let guildSelector = document.getElementById("guildSelector");
    guildSelector.addEventListener("change", async () => {
        console.log("selected guild", guildSelector.value);
        fillCategories((await WSLib.send("getCategories", { guild: guildSelector.value })).categories);
    });

    let categorySelector = document.getElementById("categorySelector");
    categorySelector.addEventListener("change", async () => {
        console.log("selected category", categorySelector.value);
        if (categorySelector.value === "add new") {
            let category = window.prompt("Category name").trim();

            if (category === "add new") {
                window.alert("You can't name a category \"add new\"");
            } else if (category.indexOf(",") !== -1) {
                window.alert("You can't have a comma in the category name");
            } else if (category) {
                categorySelector.removeChild(categorySelector.lastChild);

                let option = document.createElement("option");
                option.value = category;
                option.innerText = category;
                categorySelector.appendChild(option);

                option = document.createElement("option");
                option.value = "add new";
                option.innerText = "add new";
                categorySelector.appendChild(option);

                categorySelector.value = category;
            }
        }
        updateRows();
    });
});

async function updateRows() {
    console.log("updating rows!");
    fillTable((await WSLib.send("request", { guild: guildSelector.value, category: categorySelector.value, num: 1000 })).data);
}

function login(form) {
    WSLib = new wsLib("wss://luksab.de/node/", form.children[1].value, form.children[3].value, true);
    console.log(form)
    WSLib.on('ConnectionOpened', async function () {
        console.log("connected");

        fillGuilds((await WSLib.send("getGuilds")).guilds);

        fillCategories((await WSLib.send("getCategories", { guild: "global" })).categories);

        form.parentNode.className += "loginAnimation";
        form.parentNode.parentNode.className += "hideAnimation";
        setTimeout(() => form.parentNode.parentNode.style.display = "none", 1000);
    });
    return false;
}
