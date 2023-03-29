const express = require("express");
const fs = require("fs");
const path = require("path");
const upload = require("express-fileupload");
const app = express();
var cors = require("cors");
// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload());
app.use(cors());
// Route for uploading a video file
const router = express.Router({ mergeParams: true });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", (req, res) => {
  //   console.log(req.files);
  if (req.files) {
    const file = req.files.video;
    const fileName = file.name;
    // console.log(fileName);
    // const filePath = path.join(__dirname + "/index.html");
    // console.log(filePath);
    file.mv(`${__dirname}/uploads/${fileName}`, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send(err);
      } else {
        res.send("File uploaded!");
      }
    });
  }
});

// Route for streaming a video file
app.get("/stream/:filename?", (req, res) => {
  const fileName = req.query.filename;
  //   console.log(req.query);
  if (!fileName) {
    console.log("undefined fille namw");
    return;
  }
  //   console.log(fileName);
  //   const filePath = path.join(__dirname, "/uploads/", fileName);
  //   const filePath = `./videos/upload_video.mp4`;
  const filePath = `${__dirname}/videos/${fileName}`;

  const stat = fs.statSync(filePath);
  const found = fs.existsSync(filePath);
  if (!found) {
    res.status(404).send("Video not found");
    return;
  }
  const fileSize = stat.size;
  const range = req.headers.range;
  //   console.log(range);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    const headers = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

// // // Route for downloading a video file
app.get("/download/:filename?", (req, res) => {
  const fileName = req.query.filename;
  //   console.log(req.query);
  if (!fileName) {
    // console.log("undefined fille namw");
    return;
  }
  const filePath = `${__dirname}/videos/${fileName}`;

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).send("Video not found!");
    return;
  }

  // Download the file to the client
  res.download(filePath);
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
