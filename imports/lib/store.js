import FS from 'fs';
import { promises as FSP } from 'fs';

import { Config } from '/imports/startup/both/config';

var ActiveDirectory = "/var/data/start/";  // Don't ever want this to be null

export function setActiveDir(dirname) {
  console.log(`setActiveDir ${dirname}`)
  ActiveDirectory = Config.localFileExportRoot + dirname + '/';
  ensureDirectoryStructure('apps');
  ensureDirectoryStructure('images');
  ensureDirectoryStructure('packages');
  writeMasterIndex(ActiveDirectory);
  writeAppIndex(ActiveDirectory);
  writeImageIndex(ActiveDirectory);
  writePackageIndex(ActiveDirectory);
}

export async function setBaseDir() {
  ActiveDirectory = '/var/www/';
  await ensureDirectoryStructure('apps')
  await ensureDirectoryStructure('images');
  await ensureDirectoryStructure('packages');
  var files = await FSP.readdir('/var/www');
  console.log(files);

  writeMasterIndex(ActiveDirectory);
  writeAppIndex(ActiveDirectory);
  checkDirectory('/var/www/apps')
  writeImageIndex(ActiveDirectory);
  checkDirectory('/var/www/images');
  writePackageIndex(ActiveDirectory);
  checkDirectory('/var/www/packages');
}

async function checkDirectory(dir) {
  const files = await FSP.readdir(dir);
  console.log(files);
}
function writeMasterIndex(dir) {
  const contents = '<html><body>apps/\nimages/\npackages/\n</body></html>';
  storeStringTo(contents, 'index.html');
};

function writeAppIndex(dir) {
  const testIndex = '{"apps", [{"name": "App 1"}, {"name": "App 2"}]}';
  const contents = '<html><body>Nothing yet.</body></html';
  storeStringTo(contents, '/apps/index.html');
  storeStringTo(testIndex, '/apps/index.json');
};

function writeImageIndex(dir) {
  const contents = '<html><body>Image Index</body></html>';
  storeStringTo(contents, '/images/index.html');
};

function writePackageIndex(dir) {
  const contents = '<html><body>Package Index</body></html>';
  storeStringTo(contents, '/packages/index.html');
};

export function storeStreamTo(stream, filename) {
  const fullPath = ActiveDirectory + filename;
  if (Meteor.isServer) {
    console.log(`Storing stream to ${fullPath}`);
    return stream.pipe(FS.createWriteStream(fullPath));
  } else {
    console.log(`simulating storing stream to ${fullPath}`)
  }
  return false;
}

export function storeBufferTo(buffer, filename) {
  const fullPath = ActiveDirectory + filename;
  if (Meteor.isServer) {
    return new Promise((resolve, reject) => {
      try {
        FS.writeFileSync(fullPath, buffer);
      }
      catch(err) {
        console.log(err);
        reject(err);
      }
      resolve(true);
    })
  } else {
    console.log(`simulating writing file ${fullPath}`)
    return Promise.resolve(true);
  }
}

export function storeStringTo(string, filename) {
  const fullPath = ActiveDirectory + filename;
  if (Meteor.isServer) {
    FSP.open(fullPath, 'w')
    .then((filehandle) => {
      filehandle.write(string)
    })
  }
}

export function ensureDirectoryStructure(path) {
  console.log(`ensureDirectoryStructure ${path}`)
  const fullPath = ActiveDirectory + path
  if (Meteor.isServer) {
    console.log(`Creating ${fullPath}`);    
    return FSP.mkdir(fullPath, {recursive: true});
  } else {
    console.log(`simulating recursive mkdir of ${fullPath}`);
    return Promise.resolve(true);
  }
}

export function readFileAsString(path) {
  const filename = ActiveDirectory + path;
  return FSP.readFile(filename);
}