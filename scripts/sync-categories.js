const fs = require("fs");
const path = require("path");

const PARENT_DIR = path.resolve(__dirname, "../..");
const HUB_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(HUB_DIR, "categories.json");

const categories = [];

const entries = fs.readdirSync(PARENT_DIR, {
  withFileTypes: true
});

for (const entry of entries) {
  if (!entry.isDirectory()) continue;

  // Skip hidden folders, scripts, or the hub repo itself
  if (entry.name.startsWith(".") || entry.name === "johanbrown-books-hub" || entry.name === "node_modules") continue;

  const categoryFile = path.join(
    PARENT_DIR,
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