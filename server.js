import express from "express";
import path from "path";
import busboy from "connect-busboy"; //middleware for form/file upload
import fs from "fs-extra"; // file sys manipulation
import { processRenderFrame } from "./serverCode/processRenderFrame";
import { processConvertToGif } from "./serverCode/processConvertToGif";
import { processRenderAnimation } from "./serverCode/processRenderAnimation";

const app = express();
app.use(busboy());
const port = 8899;

// create application/json parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// share renders dir publicly
app.use(express.static(path.join(__dirname, "renders")));
app.use(express.static(path.join(__dirname, "requests")));

// home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/request/:pid", (req, res) => {
  try {
    res.send(process.kill(req.params.pid, 0));
  } catch (e) {
    res.send(false);
  }
});

// delete request
app.route("/delete").post((req, res) => {
  const filename = req.query["file"];
  console.log(`deleting ${filename} on server`);
  fs.unlink(`${__dirname}/renders/${filename}`)
    .catch((e) => {
      console.log(
        `tried to delete the file (${filename}) but there was an error!`
      );
    })
    .finally(() => {
      res.redirect("/"); // go back home
    });
});

// upload frame
app.route("/upload").post((req, res) => {
  let fstream;
  req.pipe(req.busboy);
  req.busboy.on("file", (fieldname, file, filename) => {
    console.log("Uploading: " + filename);

    fstream = fs.createWriteStream(__dirname + "/blends/" + filename);
    file.pipe(fstream);
    fstream.on("close", () => {
      console.log("Upload Finished of " + filename);
      const pid = processRenderFrame({ filename });
      res.redirect(`/?requestId=${pid}&file=${filename}_0000.png&type=image`);
    });
  });
});

const padNumbers = (num) => {
  while (`${num}`.length < 4) {
    num = "0" + `${num}`;
  }
  return num;
};

// upload animation
app.post("/uploadAnimation", (req, res) => {
  let fstream;
  req.pipe(req.busboy);

  let formData = { startFrame: 1, endFrame: 45 };
  req.busboy.on("field", function (fieldname, val) {
    formData = { ...formData, [fieldname]: val };
  });

  req.busboy.on("file", (fieldname, file, filename) => {
    console.log("Uploading: " + filename);
    fstream = fs.createWriteStream(__dirname + "/blends/" + filename);
    file.pipe(fstream);
    fstream.on("close", () => {
      console.log("Upload Finished of " + filename);
      const pid = processRenderAnimation({ filename, formData });
      const finalFileName = `${filename}_${padNumbers(
        formData.startFrame
      )}-${padNumbers(formData.endFrame)}.mkv`;
      res.redirect(`/?requestId=${pid}&file=${finalFileName}&type=animation`);
    });
  });
});

// upload gif
app.route("/uploadToGif").post((req, res) => {
  let fstream;
  req.pipe(req.busboy);
  req.busboy.on("file", (fieldname, file, filename) => {
    console.log("Uploading: " + filename);

    fstream = fs.createWriteStream(__dirname + "/blends/" + filename);
    file.pipe(fstream);
    fstream.on("close", () => {
      console.log("Upload Finished of " + filename);
      const pid = processConvertToGif({ filename });
      res.redirect(`/?requestId=${pid}&file=${filename}.gif&type=image`);
    });
  });
});

app.listen(port, () => {
  console.log(`BRRS listening at http://localhost:${port}`);
});
