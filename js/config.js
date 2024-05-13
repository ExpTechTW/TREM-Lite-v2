/* eslint-disable no-undef */
setInterval(() => {
  if (variable._config != generateMD5(JSON.stringify(variable.config))) {
    variable._config = generateMD5(JSON.stringify(variable.config));
    save_config();
  }
}, constant.CONFIG_AUTO_SAVE_TIME);

try {
  variable.config = JSON.parse(localStorage.config);
  logger.info("Config parsed success");
} catch (err) {
  logger.error("Config parsed failed");
  variable.config = {};
}

function save_config() {
  localStorage.config = JSON.stringify(variable.config);
}