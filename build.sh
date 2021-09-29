#!/bin/bash
echo '------ 打包开始'
cd $WORKSPACE
export PATH=/home/envuser/local/node-v6.9.2-linux-x64/bin/:$PATH
npm install --registry http://npm.envisioncn.com:7001/
npm run build
echo '------ 打包结束'

echo '------ npm 发布开始'
mkdir build
cd build
cp -r ../eoswind3dweb ./

echo '------ [generate temp.js under build]'
cat <<EOT  > temp.js
console.log("running js script");
var pkgjson = require("../package.json");
var pkgName = pkgjson.name;
var pkgVersion = pkgjson.version;
var pkgLicense = pkgjson.license;
var description = pkgjson.description;

var newPackagejson = {
  name:pkgName,
  version:pkgVersion,
  license:pkgLicense,
  description:description,
  publishedAt:new Date().toLocaleString()
}

var cp = require("child_process");
var cmds = [
  \`pwd;echo '\${JSON.stringify(newPackagejson)}' > package.json;\`,
  \`npm unpublish \${pkgName}@\${pkgVersion};\`,
  \`[ -d ./nodejs ] && rm -r nodejs || echo no folder to remove\`,
  \`npm publish .;\`
];
cmds.forEach(function(cmd){
  console.log("[run cmd]:  ", cmd);
  console.log(cp.execSync(cmd).toString());
})
EOT

node temp.js
cd ..
rm -rf build
echo '------ npm 发布结束'

cd ./eoswind3dweb && zip -r -o ../eoswind3dweb.zip *
cd $WORKSPACE
mkdir ./target
cp -p ./eoswind3dweb.zip ./target