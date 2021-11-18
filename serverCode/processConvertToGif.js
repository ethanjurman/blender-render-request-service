import { exec } from "child_process";
import fs from "fs-extra"; // file sys manipulation
import { addToDataStream, clearDataStream } from "./dataStream";

export const processConvertToGif = ({ filename }) => {
  console.log("Start gif process " + filename);
  const gifCommand = `ffmpeg -y -i "${__dirname}\\..\\blends\\${filename}" -vf "fps=24, scale=1080:-1:flags=lanczos,palettegen" palette.png && ffmpeg -y -i "${__dirname}\\..\\blends\\${filename}" -i palette.png -q 0 -filter_complex "fps=24,scale=1080:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" "${__dirname}\\..\\renders\\${filename}.gif"`;
  console.log(gifCommand);
  const gifProcess = exec(gifCommand);
  gifProcess.stdout.on("data", (data) => {
    addToDataStream(`${data}`);
    console.log(`stdout: ${data}`);
  });
  gifProcess.on("error", (err) => console.log("error", err));
  gifProcess.on("exit", (code) => {
    console.log("gif complete", code);
    clearDataStream();
    fs.unlink(`blends/${filename}`) // deletes original file
      .catch((e) => {
        console.log(
          `tried to delete the file (${filename}) but there was an error!`
        );
      });
  });
  return gifProcess.pid;
};
