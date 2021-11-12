import { exec } from "child_process";
import express from "express";
import path from "path";
import busboy from "connect-busboy"; //middleware for form/file upload
import fs from "fs-extra"; // file sys manipulation

const app = express();
app.use(busboy());
const port = 8899;

// create application/json parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// share renders dir publicly
app.use(express.static(path.join(__dirname, "renders")));

// home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// delete request
app.route("/delete").post((req, res) => {
  const filename = req.query["file"];
  console.log(`deleting ${filename} on server`);
  fs.unlink(`${__dirname}/renders/${filename}`); // deletes file
  res.redirect("/"); // go back home
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

      console.log("Start blender process " + filename);
      const blenderCommand = `blender -b blends/${filename} -o "${__dirname}\\renders\\${filename}_####" -f 0  -- --cycles-device CUDA`;
      console.log(blenderCommand);
      const blenderProcess = exec(blenderCommand);
      blenderProcess.on("error", (err) => console.log("error", err));
      blenderProcess.on("exit", () => {
        console.log("blender finished");
        fs.unlink(`${__dirname}/blends/${filename}`); // deletes file
        res.redirect(`/?file=${filename}_0000.png`); // go back home w/ query param
      });
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
      console.log("Start blender process " + filename);
      const blenderCommand = `blender -b blends/${filename} -o "${__dirname}\\renders\\${filename}_####" -s ${formData.startFrame} -e ${formData.endFrame} -a -- --cycles-device CUDA`;
      console.log(blenderCommand);
      const blenderProcess = exec(blenderCommand);
      blenderProcess.on("error", (err) => console.log("error", err));
      blenderProcess.on("exit", () => {
        console.log("blender finished");
        fs.unlink(`${__dirname}/blends/${filename}`); // deletes file
        res.redirect(
          `/?animation=true&file=${filename}_${padNumbers(
            formData.startFrame
          )}-${padNumbers(formData.endFrame)}.mkv`
        ); // go back home w/ query param
      });
    });
  });
});

app.listen(port, () => {
  console.log(`BRRS listening at http://localhost:${port}`);
});
