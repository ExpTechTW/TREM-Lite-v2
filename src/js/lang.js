/* eslint-disable no-undef */
const lang_file = fs.readFileSync(path.join(__dirname, "../resource/lang", "zh-Hant.yml")).toString();

const lang_data = yaml.load(lang_file);

constant.LANG = lang_data;