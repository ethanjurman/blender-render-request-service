import { spawn } from "child_process";
import fs from "fs-extra"; // file sys manipulation

export const processRenderFrame = ({ filename }) => {
  console.log("Start blender process " + filename);
  const blenderProcess = spawn("blender", [
    "-b",
    `blends\\${filename}`,
    `-o`,
    `${__dirname}\\..\\renders\\${filename}_####`,
    `-f`,
    `0`,
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
    // deletes blender file
    fs.unlink(`blends/${filename}`).catch((e) => {
      console.log(
        `tried to delete the file (${filename}) but there was an error!`
      );
    });
  });
  return blenderProcess.pid;
};
