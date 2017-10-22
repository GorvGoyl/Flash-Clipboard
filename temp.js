

{
    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I'
  }

  npm rebuild --runtime=electron --target=1.4.13 --disturl=https://atom.io/download/atom
  -shell --abi=48

  electron-packager ./ multiCopypaste2 --platform=win32 --arch=x64 --overwrite