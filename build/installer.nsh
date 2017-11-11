!macro customUnInstall
    SetRegView 64
	 DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Multicopy Paste"
	SetRegView 32
	DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Multicopy Paste"
 !macroend

