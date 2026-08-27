const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const HUB_DIR = ROOT_DIR;
const OUTPUT_FILE = path.join(HUB_DIR, "categories.json");

const categories = [];

const entries = fs.readdirSync(ROOT_DIR, {
  withFileTypes: true
});

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  // Skip the hub itself
  if (entry.name === "johanbrown-books-hub") continue;

  const categoryFile = path.join(
    ROOT_DIR,
    entry.name,
    "category.json"
  );

  // Only include valid category directories
  if (!fs.existsSync(categoryFile)) continue;

  try {
    const category = JSON.parse(
      fs.readFileSync(categoryFile, "utf8")
    );

    categories.push({
      ...category,
      folder: entry.name
    });
  } catch (error) {
    console.error(
      `Could not read category: ${entry.name}`,
      error.message
    );
  }
}

// Sort by display order
categories.sort(
  (a, b) => (a.order || 999) - (b.order || 999)
);

const output = {
  generatedAt: new Date().toISOString(),
  categories
};

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(output, null, 2)
);

console.log(
  `categories.json updated with ${categories.length} categories.`
);