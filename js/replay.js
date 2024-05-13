/* eslint-disable no-undef */
let replay_timer;
if (variable.replay_list.length)
  replay_timer = setInterval(() => read_replay_file(), 1000);

function read_replay_file() {
  if (!variable.replay_list.length) {
    variable.replay = 0;
    if (replay_timer) clearInterval(replay_timer);
    return;
  }

  const name = variable.replay_list.shift();

  const data = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), `replay/${name}`)).toString());

  const alert = Object.keys(data.rts.box).length;
  show_rts_dot(data.rts, alert);
  if (alert) show_rts_box(data.rts.box);

  for (const eew of data.eew) {
    eew.time = data.rts.time;
    eew.timestamp = now();
    // eew.eq.mag = 1;
    show_eew(eew);
  }

  variable.replay = data.rts.time;

  console.log(name);
}