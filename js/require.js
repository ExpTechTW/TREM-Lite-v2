/* eslint-disable no-undef */
require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
const { app } = require("@electron/remote");
const { ipcRenderer } = require("electron");
const path = require("path");

const Speech = require("speak-tts");

const winston = require("winston");
require("winston-daily-rotate-file");

const fs = require("fs-extra");
const yaml = require("js-yaml");
const crypto = require("crypto");

constant.TIME_TABLE = require(path.join(__dirname, "../resource/data", "time.json"));
constant.TIME_TABLE_OBJECT = Object.keys(constant.TIME_TABLE);
constant.REGION = require(path.join(__dirname, "../resource/data", "region.json"));
constant.BOX_GEOJSON = require(path.join(__dirname, "../resource/map", "box.json"));
constant.BOX_GEOJSON.features.forEach(feature => feature.properties = {
  id: feature.id,
});

const replayPath = path.join(app.getPath("userData"), "replay");
if (!fs.existsSync(replayPath)) fs.mkdirSync(replayPath);
variable.replay_list = fs.readdirSync(replayPath);