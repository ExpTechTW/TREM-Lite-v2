/* eslint-disable no-undef */
document.onkeydown = (e) => {
  if (e.key == "F11") ipcRenderer.send("toggleFullscreen");
  else if (e.key == "F12") ipcRenderer.send("openDevtool");
  else if (e.key == "Escape") ipcRenderer.send("hide");
  else if (e.ctrlKey && e.key.toLocaleLowerCase() == "r") ipcRenderer.send("reload");
};