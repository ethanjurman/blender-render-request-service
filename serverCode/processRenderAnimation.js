import { spawn } from "child_process";
import fs from "fs-extra"; // file sys manipulation

export const processRenderAnimation = ({ filename, formData }) => {
  console.log("Start blender process " + filename);
  const blenderProcess = spawn("blender", [
    "-b",
    `blends\\${filename}`,
    `-o`,
    `${__dirname}\\..\\renders\\${filename}_####`,
    `-s`,
    `${formData.startFrame}`,
    `-e`,
    `${formData.endFrame}`,
    `-a`,
    `--`,
    `--cycles-device`,
    `CUDA`,
  ]);
  blenderProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });
  blenderProcess.on("error", (err) => console.log("error", err));
  blenderProcess.on("exit", () => {
    console.log("blender finished");
    fs.unlink(`blends/${filename}`) // deletes file
      .catch((e) => {
        console.log(
          `tried to delete the file (${filename}) but there was an error!`
        );
      });
  });
  return blenderProcess.pid;
};
