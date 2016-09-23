
const {app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray} = require('electron')
const path = require('path')
const Config = require('electron-config')

const config = new Config()

let appIcon = null
let mainWindow = null
let contextMenu
let mainMenu = Menu.buildFromTemplate([
	{
		label: "Piece",
		submenu: [
			{
				label: "About Piece",
				click: openAboutWindow
			},
			{
				type: "separator"
			},
			{
				label: 'Hide Piece',
				accelerator: 'Command+H',
				role: 'hide'
			},
			{
				label: 'Hide Others',
				accelerator: 'Command+Alt+H',
				role: 'hideothers'
			},
			{
				label: 'Show All',
				role: 'unhide'
			},
			{
				type: 'separator'
			},
			{
				label: "Quit",
				accelerator: "Command+Q",
				click: function() {
					app.quit()
				}
			}
		]
	},
    {
		label: "Edit",
		submenu: [
			{
				label: "Undo",
				accelerator: "CmdOrCtrl+Z",
				selector: "undo:"
			},
			{
				label: "Redo",
				accelerator: "Shift+CmdOrCtrl+Z",
				selector: "redo:"
			},
			{
				type: "separator"
			},
			{
				label: "Cut",
				accelerator: "CmdOrCtrl+X",
				selector: "cut:"
			},
			{
				label: "Copy",
				accelerator: "CmdOrCtrl+C",
				selector: "copy:"
			},
			{
				label: "Paste",
				accelerator: "CmdOrCtrl+V",
				selector: "paste:"
			},
			{
				label: "Select All",
				accelerator: "CmdOrCtrl+A",
				selector: "selectAll:"
			}
		]
	},
	{
		label: 'Window',
		role: 'window',
		submenu: [
			{
				label: 'Close',
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			}
		]
	}
])

app.on('window-all-closed', () => {
	if (process.platform != 'darwin') {
		app.quit()
	}
})

let aboutWindow = null
function openAboutWindow() {
	if (aboutWindow) {
		return
	}

	aboutWindow = new BrowserWindow({
		width: 366,
		height: 434,
		resizable: false,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		alwaysOnTop: true
	})

	aboutWindow.loadURL('file://' + __dirname + '/about.html')

	aboutWindow.on('resize', () => {
		let size = aboutWindow.getSize()
	})

	aboutWindow.on('closed', () => {
		aboutWindow = null
	})
}

function installDevtools() {
	const devtoolsInstaller = require('electron-devtools-installer')
  devtoolsInstaller.default(devtoolsInstaller.REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension: ${name}`))
    .catch((err) => console.log('An error occurred: ', err))
}

function openMainWindow() {
	let frame = false
	let alwaysOnTop = true

	if (process.env.NODE_ENV === 'development') {
		frame = true
		alwaysOnTop = false
	}

	mainWindow = new BrowserWindow({
		width: config.get('width'),
		height: config.get('height'),
		frame: frame,
		alwaysOnTop: alwaysOnTop
	})

	if (config.has('x') && config.has('y')) {
		mainWindow.setPosition(config.get('x'), config.get('y'))
	}

	mainWindow.loadURL('file://' + __dirname + '/index.html')

	mainWindow.on('resize', () => {
		let size = mainWindow.getSize()
		config.set('width', size[0])
		config.set('height', size[1])
	})

	mainWindow.on('move', () => {
		let position = mainWindow.getPosition()
		config.set('x', position[0])
		config.set('y', position[1])
	})

	mainWindow.on('close', () => {
		contextMenu.items[1].checked = false
		appIcon.setContextMenu(contextMenu)
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}



function initConfig() {
	if (!config.has('content')) {
		const oldConfig = require('./config')
		if (oldConfig.readConfig('x')) {
			// Old config exists
			config.set('x', oldConfig.readConfig('x'))
			config.set('y', oldConfig.readConfig('y'))
			config.set('width', oldConfig.readConfig('width'))
			config.set('height', oldConfig.readConfig('height'))
			config.set('content', oldConfig.readConfig('content'))
		} else {
			// Not exists
			const defaultConfig = require('./config.default')
			config.set('width', defaultConfig.width)
			config.set('height', defaultConfig.height)
			config.set('content', defaultConfig.content)
		}
		config.set('shortcutShow', 'Shift+Alt+S')
		config.set('alwaysOnTop', true)
	}
}

app.on('ready', () => {
	initConfig()

	openMainWindow()

	const iconPath = path.join(__dirname, '/img/tray-icon.png')
	appIcon = new Tray(iconPath)
	appIcon.setToolTip('Piece')

	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show',
			type: 'checkbox',
			checked: true,
	    accelerator: config.get('shortcutShow'),
			click: toggleShow
		},
		{
			type: 'separator'
		},
		{
			label: 'About Piece',
			click: openAboutWindow
		},
		{
			type: 'separator'
		},
		{
			label: 'Quit Piece',
			click: function () {
				app.quit()
			}
		}
	])
	appIcon.setContextMenu(contextMenu)

	appIcon.on('right-click', () => {
		show()
	})

	setGlobalShortcuts()

	app.focus()
	app.show()
	mainWindow.show()
	mainWindow.focus()

	if (process.env.NODE_ENV === 'development') {
		installDevtools()
		mainWindow.openDevTools()
	} else {
		app.dock.hide()
	}

  Menu.setApplicationMenu(mainMenu)
})

ipcMain.on('save-content', (event, arg) => {
	config.set('content', arg)
})

function toggleShow() {
	if (!mainWindow) {
		openMainWindow()
	}
	if (contextMenu.items[0].checked) {
		mainWindow.show()
	} else {
		mainWindow.hide()
	}
}

function show() {
	mainWindow.hide()
	mainWindow.show()
	contextMenu.items[0].checked
}

function setGlobalShortcuts() {
	globalShortcut.unregisterAll()

	globalShortcut.register(config.get('shortcutShow'), () => {
		contextMenu.items[0].checked = !contextMenu.items[0].checked
		toggleShow()
		appIcon.setContextMenu(contextMenu)
	})
}
