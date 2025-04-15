
const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const replacements = [
  { from: 'imageSrc', to: 'images' },
  { from: 'keyWords', to: 'tags' },
  { from: 'phoneNumber', to: 'phone' },
  { from: 'displayName', to: 'name' },
  { from: 'quantityType', to: 'unit' },
  { from: 'location?.address[0]', to: 'location.address.street' },
  { from: 'location?.address[1]', to: 'location.address.city' },
  { from: 'location?.address[2]', to: 'location.address.state' },
  { from: 'location?.address[3]', to: 'location.address.zip' },
  { from: 'location.address[0]', to: 'location.address.street' },
  { from: 'location.address[1]', to: 'location.address.city' },
  { from: 'location.address[2]', to: 'location.address.state' },
  { from: 'location.address[3]', to: 'location.address.zip' },
];

const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

// Basic directories to skip
const skipDirectories = ['node_modules', '.next', 'out', 'build', '.git'];

// Specific paths to skip (relative to the project root)
const skipPaths = [
  path.join('app', 'api'),
  path.join('components', 'ui')
];

async function shouldSkipDirectory(directoryPath) {
  // Check if the directory name is in the skipDirectories list
  const dirName = path.basename(directoryPath);
  if (skipDirectories.includes(dirName)) {
    return true;
  }
  
  // Check if the path (relative to the project root) is in the skipPaths list
  const relativePath = path.relative(process.cwd(), directoryPath);
  return skipPaths.some(skipPath => relativePath === skipPath || relativePath.startsWith(skipPath + path.sep));
}

async function processDirectory(directoryPath) {
  try {
    // Check if this directory should be skipped
    if (await shouldSkipDirectory(directoryPath)) {
      console.log(`Skipping directory: ${directoryPath}`);
      return;
    }

    const items = await readdir(directoryPath);
    
    for (const item of items) {
      const itemPath = path.join(directoryPath, item);
      const itemStat = await stat(itemPath);
      
      if (itemStat.isDirectory()) {
        await processDirectory(itemPath);
        continue;
      }
      
      const ext = path.extname(itemPath).toLowerCase();
      if (fileExtensions.includes(ext)) {
        await processFile(itemPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directoryPath}:`, error);
  }
}

async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    
    for (const { from, to } of replacements) {
      const patterns = [
        // Object property definitions with quotes (e.g., { "images": ... })
        new RegExp(`"${from}"\\s*:`, 'g'),
        // Object property definitions without quotes (e.g., { images: ... })
        new RegExp(`(?<![\\w$])${from}\\s*:`, 'g'),
        // Destructuring (e.g., const images: = obj;)
        new RegExp(`({\\s*[\\w$,\\s]*)${from}(\\s*[,}])`, 'g'),
        // Dot notation (e.g., obj.images)
        new RegExp(`\\.${from}(?![\\w$])`, 'g'),
        // JSX props (e.g., <Component images={...} />)
        new RegExp(`(?<=\\s)${from}=`, 'g'),
        // Bracket notation with quotes (e.g., obj["images"])
        new RegExp(`\\["${from}"\\]`, 'g'),
        new RegExp(`\\['${from}'\\]`, 'g')
      ];
      
      for (const pattern of patterns) {
        const newContent = content.replace(pattern, (match) => {
          if (pattern.source.includes('{\\s*[\\w$,\\s]*}')) {
            // For destructuring pattern
            return match.replace(from, to);
          } else if (pattern.source.includes('\\.')) {
            // For dot notation
            return `.${to}`;
          } else if (pattern.source.includes('\\["')) {
            // For bracket notation with double quotes
            return `["${to}"]`;
          } else if (pattern.source.includes("\\'")) {
            // For bracket notation with single quotes
            return `['${to}']`;
          } else if (pattern.source.includes('(?<=\\s)')) {
            // For JSX props
            return `${to}=`;
          } else if (pattern.source.includes('"')) {
            // For quoted object properties
            return `"${to}":`;
          } else {
            // For unquoted object properties
            return `${to}:`;
          }
        });
        
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    // Save the file if it was modified
    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Entry point
async function main() {
  const appDir = path.join(process.cwd(), '');
  
  // Check if app directory exists
  try {
    await stat(appDir);
  } catch (error) {
    console.error('Error: The "app" directory does not exist in the current working directory.');
    console.error('Please run this script from the root of your Next.js project.');
    process.exit(1);
  }
  
  console.log('Starting renaming process...');
  console.log(`Renaming instances of:`);
  replacements.forEach(({ from, to }) => {
    console.log(`  - "${from}" to "${to}"`);
  });
  
  console.log('The following directories will be skipped:');
  console.log('  - Standard directories:', skipDirectories.join(', '));
  console.log('  - Specific paths:');
  skipPaths.forEach(path => console.log(`    - ${path}`));
  
  await processDirectory(appDir);
  
  // Also process the components directory if it exists
  const componentsDir = path.join(process.cwd(), 'components');
  try {
    await stat(componentsDir);
    await processDirectory(componentsDir);
  } catch (error) {
    // If components directory doesn't exist, just continue
  }
  
  console.log('Renaming process completed successfully!');
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
