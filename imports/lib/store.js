import FS from 'fs';
import { promises as FSP } from 'fs';

import { Config } from '/imports/startup/both/config';

var ActiveDirectory = "/var/data/start/";  // Don't ever want this to be null
export const BaseDir = '/var/data'

export async function setStartDir() {
  await setBaseDir('start');
  await renameToWWW('start');
};

export async function setBaseDir(tag) {
  await ensureDirectoryStructure(`${BaseDir}/${tag}/apps`)
  await writeMasterIndex(`${BaseDir}/${tag}`);
  await writeAppIndex(`${BaseDir}/${tag}`);

  await ensureDirectoryStructure(`${BaseDir}/${tag}/images`)
  await writeImageIndex(`${BaseDir}/${tag}`);
  
  await ensureDirectoryStructure(`${BaseDir}/${tag}/packages`)
  await writePackageIndex(`${BaseDir}/${tag}`);

  await checkDirectory(`${BaseDir}/${tag}`);
}

export async function renameToWWW(tag) {
  await FSP.rm(`/var/www`, {force: true, recursive: true});
  await FSP.rename(`${BaseDir}/${tag}`, '/var/www');
  await checkDirectory('/var/www')
}

async function checkDirectory(dir) {
  const files = await FSP.readdir(dir);
  console.log(files);
}

function writeMasterIndex(dir) {
  const contents = `<html><body><h4>${dir}</h4><p>Created: ${Date.now()}</body></html>`;
  storeStringTo(contents, `${dir}/index.html`);
};

function writeAppIndex(dir) {
  const testIndex = '{"apps": []}';
  const contents = `<html><body><h4>${dir}/apps</h4></body></html`;
  storeStringTo(contents, `${dir}/apps/index.html`);
  storeStringTo(testIndex, `${dir}/apps/index.json`);
};

function writeImageIndex(dir) {
  const contents = `<html><body><h4>${dir}/images</h4></body></html>`;
  storeStringTo(contents, `${dir}/images/index.html`);
};

function writePackageIndex(dir) {
  const contents = `<html><body><h4>${dir}/packages</h4</body></html>`;
  storeStringTo(contents, `${dir}/packages/index.html`);
};

export function storeStreamTo(stream, fullPath) {
  if (Meteor.isServer) {
    console.log(`Storing stream to ${fullPath}`);
    return stream.pipe(FS.createWriteStream(fullPath));
  } else {
    console.log(`simulating storing stream to ${fullPath}`)
  }
  return false;
}

export function storeBufferTo(buffer, fullPath) {
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

export async function storeStringTo(string, fullPath) {
  if (Meteor.isServer) {
    const filehandle = await FSP.open(fullPath, 'w');
    await filehandle.write(string);
    await filehandle.close();
  }
}

export function ensureDirectoryStructure(path) {
  if (Meteor.isServer) {
    console.log(`Creating ${path}`);    
    return FSP.mkdir(path, {recursive: true});
  } else {
    console.log(`simulating recursive mkdir of ${path}`);
    return Promise.resolve(true);
  }
}

export function readFileAsString(path) {
  const filename = ActiveDirectory + path;
  return FSP.readFile(filename);
}