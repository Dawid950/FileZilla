const path = require('path');
const express = require('express');
const hbs = require('express-handlebars');
const formidable = require('formidable');
const files = require('./data/data');
const iconsCustom = require('./data/icons');

const app = express();
const PORT = process.env.PORT || 3000;

process.env.TZ = "Europe/Warsaw";

let index = 0;

app.use(express.static(path.join(__dirname, 'static')));
console.log("1")
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main.hbs',
    helpers: iconsCustom,
    partialsDir: path.join(__dirname, 'views', 'partials')
}));

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('home', { view: 'home' });
});

app.get('/upload', (req, res) => {
    res.render('upload', { view: 'upload' });
});

app.post('/upload', (req, res) => {
    const form = new formidable.IncomingForm({
        uploadDir: path.join(__dirname, 'static', 'upload'),
        keepExtensions: true,
        multiples: true
    });
    form.on('fileBegin', (name, file) => {
        file.path = path.join(form.uploadDir, file.name);
    });
    form.parse(req, (_, fields, { file }) => {
        res.redirect('/filemanager');
        if (Array.isArray(file)) {
            file = file.filter(f => files.every(d => d.name != f.name));
            file.forEach(f => {
                index++;
                const savedate = new Date().toLocaleString();
                files[index] = { index, savedate, ...f };
            })
        } else {
            if (!files.every(d => file.name != d.name)) return;
            index++
            file.index = index;
            file.savedate = new Date().toLocaleString();
            files[file.index] = file;
        }
    });
});

app.get('/filemanager', (req, res) => {
    res.render('filemanager', { view: 'filemanager', files });
});

function getFile(id) {
    return files[id];
}

app.get('/download/:id', (req, res) => {
    const { id } = req.params;
    const { name } = getFile(id);
    res.download(path.join(__dirname, 'static', 'upload', name));
});

app.get('/info/:id', (req, res) => {
    const { id } = req.params;
    const file = getFile(id);
    res.render('info', { ...file });
});

app.get('/delete/:id?', (req, res) => {
    const { id } = req.params;
    if (!id) {
        files.splice(0);
    } else {
        const frag = files.splice(id);
        frag.shift();
        frag.forEach(f => files[f.index] = f);
    }
    res.redirect('/filemanager');
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
