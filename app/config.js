'use strict'

const nconf = require('nconf')

nconf.argv().env().file({file: getUserHome() + '/Documents/.piece.config.json'})

function saveConfig(settingKey, settingValue) {
    nconf.set(settingKey, settingValue)
    nconf.save()
}

function readConfig(settingKey) {
    nconf.load()
    return nconf.get(settingKey)
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
}

module.exports = {
    saveConfig: saveConfig,
    readConfig: readConfig
}
