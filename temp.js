

{
    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I'
  }

  npm rebuild --runtime=electron --target=1.4.13 --disturl=https://atom.io/download/atom
  -shell --abi=48

  electron-packager ./ multiCopypaste2 --platform=win32 --arch=x64 --overwrite
//npm commands
npm list
lists all installed packages
npm prune
removes packages not depended on by your project according to your package.json
npm outdated (-g)
tells you which installed packages are outdated with respect to what is current in the npm registry but allowable by the version definition in your package.json

npm update
Update all packages listed in package.json
Clean npm cache
npm cache clean -f
  //steps:
  - install latest nodejs from official site
  - check node and npm --version
      node: 8.7.0, npm: 5.4.2
  - clone repo from github
  - open with vscode
  - //run in terminal: npm install electron --save-dev --save-exact
  - install electron : npm install electron -g
          electron version: 1.7.9


      to run: electron ./main.js
      //extra
      npm rebuild --runtime=electron --target=1.7.9 --disturl=https://atom.io/download/atom-shell --abi=57 