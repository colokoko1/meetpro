const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Sample in-memory database
const codesDatabase = [];
const uploadDirectories = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const code = req.params.code;
        const uploadDir = path.join(__dirname, 'uploads', code);
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

app.post('/generate-code', (req, res) => {
    const code = Math.floor(100000 + Math.random() * 900000);
    codesDatabase.push(code);
    uploadDirectories[code] = uuidv4(); // Generate a unique directory identifier for each code
    res.json({ code });
});

app.post('/validate-code', (req, res) => {
    const enteredCode = Number(req.body.code);
    const directoryPath = path.join(__dirname, 'uploads', String(enteredCode));

    console.log('Entered Code:', enteredCode);
    console.log('Directory Path:', directoryPath);

    // Check if the directory exists for the entered code
    const directoryExists = fs.existsSync(directoryPath);

    if (directoryExists) {
        console.log('Directory exists. Allowing access.');
        res.json({ success: true });
    } else {
        console.log('Directory does not exist. Unauthorized request.');
        res.json({ success: false });
    }
});


app.post('/upload/:code', upload.single('file'), (req, res) => {
    res.json({ success: true });
});

app.get('/download/:code/:filename', (req, res) => {
    const code = req.params.code;
    const filePath = path.join(__dirname, 'uploads', code, req.params.filename);
    console.log('File Path:', filePath);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        console.log('File exists. Sending...');
        res.sendFile(filePath);
    } else {
        console.log('File does not exist.');
        res.status(404).send('File not found');
    }
});




app.get('/files/:code', (req, res) => {
    const code = req.params.code;
    const filesPath = path.join(__dirname, 'uploads', code);

    fs.readdir(filesPath, (err, files) => {
        if (err) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json({ files });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
