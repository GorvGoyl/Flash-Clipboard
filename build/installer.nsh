!macro customUnInstall
    SetRegView 64
	 DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Flash Clipboard"
	SetRegView 32
	DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Flash Clipboard"
 !macroend

