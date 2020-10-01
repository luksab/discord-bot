"use strict";
const { Pool } = require('pg')
/*CREATE TABLE imgs (
    Personid INT NOT NULL AUTO_INCREMENT,
    explicitness CHAR(1) NOT NULL,
    score INT,
    width INT,
    height INT,
    file_size INT,
    uploader_id INT,
    file_ext CHAR(3),
    path VARCHAR(255)
);*/
/*CREATE TABLE userRatings (
    userID INT NOT NULL,
    id INT NOT NULL,
    rating FLOAT NOT NULL
);*/
/*CREATE TABLE tags (
    tagID INT PRIMARY KEY,
    name VARCHAR(1024)
);*/
/*CREATE TABLE imtags (
    tagID INT,
    imID INT
);*/

const pool = new Pool({
    user: 'node',
    host: 'localhost',
    database: 'neverever',
    password: 'System5362<cut<<',
    port: 5432,
});

const fs = require('fs');

let questions = {};
let NSFWquestions = {};
function readFiles(dirname, q, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            fs.readFile(dirname + filename, 'utf-8', function (err, content) {
                try {
                    q[filename] = content.split("\n");
                } catch (e) { }
            });
        });
    });
}

readFiles("./files/nevrevr/", questions, console.log);
readFiles("./files/nevrevr/nsfw/", NSFWquestions, console.log);

async function quieres() {
    await pool.query("DROP TABLE questions;")

    await pool.query(`
    CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        category TEXT,
        explicitness CHAR(1)
    );
    `);
    await pool.query("DELETE FROM questions");

    for (const category in questions) {
        if (questions.hasOwnProperty(category)) {
            const c = questions[category];
            for (const q of c) {
                console.log(category,q)
                await pool.query("INSERT INTO questions (category, question, explicitness) VALUES ($1, $2, 's')",
                    [category, q]);
            }
        }
    }

    for (const category in NSFWquestions) {
        if (NSFWquestions.hasOwnProperty(category)) {
            const c = NSFWquestions[category];
            for (const q of c) {
                console.log(category,q)
                await pool.query("INSERT INTO questions (category, question, explicitness) VALUES ($1, $2, 'q')",
                    [category, q]);
            }

        }
    }

    console.log((await pool.query("SELECT count(*) FROM questions")).rows);
}


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

sleep(5000).then(() => quieres().then(() => process.exit()));



//pool.query("INSERT INTO imgs (id, explicitness, file_ext, path)")