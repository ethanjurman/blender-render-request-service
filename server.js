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
app.use(express.static(path.join(__dirname, "requests")));

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

const makeRequestId = () => {
  const requestId = Date.now();
  exec(`touch ${__dirname}/requests/${requestId}`);
  console.log("making request", requestId);
  return requestId;
};

const removeRequestId = (requestId) => {
  console.log("removing request", requestId);
  fs.unlink(`${__dirname}/requests/${requestId}`);
};

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
      const requestId = makeRequestId();
      renderFrame({ filename, requestId });
      res.redirect(
        `/?requestId=${requestId}&file=${filename}_0000.png&type=image`
      );
    });
  });
});

const renderFrame = ({ filename, requestId }) => {
  console.log("Start blender process " + filename);
  const blenderCommand = `blender -b blends/${filename} -o "${__dirname}\\renders\\${filename}_####" -f 0  -- --cycles-device CUDA`;
  console.log(blenderCommand);
  const blenderProcess = exec(blenderCommand);
  blenderProcess.on("error", (err) => console.log("error", err));
  blenderProcess.on("exit", () => {
    console.log("blender finished");
    try {
      fs.unlink(`${__dirname}/blends/${filename}`); // deletes blender file
    } catch (e) {}
    removeRequestId(requestId); // removes request id
  });
};

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
      const requestId = makeRequestId();
      renderGif({ filename, requestId });
      res.redirect(`/?requestId=${requestId}&file=${filename}.gif&type=image`);
    });
  });
});

const renderGif = ({ filename, requestId }) => {
  console.log("Start gif process " + filename);
  const gifCommand1 = `ffmpeg -y -i blends/${filename} -vf "fps=24, scale=1080:-1:flags=lanczos,palettegen" palette.png`;
  const gifCommand2 = `ffmpeg -i blends/${filename} -i palette.png -q 0 -filter_complex "fps=24,scale=1080:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" renders/${filename}.gif`;
  console.log(gifCommand1, gifCommand2);
  const gifProcess1 = exec(gifCommand1);
  gifProcess1.on("error", (err) => console.log("error", err));
  gifProcess1.on("exit", (code) => {
    console.log("pallet complete", code);
    const gifProcess2 = exec(gifCommand2);
    gifProcess2.on("error", (err) => console.log("error", err));
    gifProcess2.on("exit", (code) => {
      console.log("gif complete", code);
      try {
        fs.unlink(`${__dirname}/blends/${filename}`); // deletes original file
      } catch (e) {}
      removeRequestId(requestId); // removes request id
    });
  });
};

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
      const requestId = makeRequestId();
      renderAnimation({ filename, formData, requestId });
      const finalFileName = `${filename}_${padNumbers(
        formData.startFrame
      )}-${padNumbers(formData.endFrame)}.mkv`;
      res.redirect(
        `/?requestId=${requestId}&file=${finalFileName}&type=animation`
      );
    });
  });
});

const renderAnimation = ({ filename, formData, requestId }) => {
  console.log("Start blender process " + filename);
  const blenderCommand = `blender -b blends/${filename} -o "${__dirname}\\renders\\${filename}_####" -s ${formData.startFrame} -e ${formData.endFrame} -a -- --cycles-device CUDA`;
  console.log(blenderCommand);
  const blenderProcess = exec(blenderCommand);
  blenderProcess.on("error", (err) => console.log("error", err));
  blenderProcess.on("exit", () => {
    console.log("blender finished");
    try {
      fs.unlink(`${__dirname}/blends/${filename}`); // deletes file
    } catch (e) {}
    removeRequestId(requestId); // removes request id
  });
};

app.listen(port, () => {
  console.log(`BRRS listening at http://localhost:${port}`);
});
