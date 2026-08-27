const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const PARENT_DIR = path.resolve(__dirname, "../..");
const HUB_DIR = path.resolve(__dirname, "..");

console.log("Watching category directories...");

let timeout;

fs.watch(
  PARENT_DIR,
  { recursive: true },
  (eventType, filename) => {
    if (!filename) return;

    if (
      filename.includes("category.json") ||
      eventType === "rename"
    ) {
      clearTimeout(timeout);

      timeout = setTimeout(() => {
        console.log("Category change detected. Syncing...");

        exec(
          "node scripts/sync-categories.js",
          {
            cwd: HUB_DIR
          },
          (error, stdout, stderr) => {
            if (error) {
              console.error(error.message);
              return;
            }

            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
          }
        );
      }, 500);
    }
  }
);