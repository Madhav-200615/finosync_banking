const fs = require('fs');
const path = require('path');

const read = (filename) => {
    const file = path.join(__dirname, '../../data', filename);
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
};

const write = (filename, data) => {
    const file = path.join(__dirname, '../../data', filename);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

module.exports = { read, write };
