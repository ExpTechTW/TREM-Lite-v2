/* eslint-disable no-undef */
const doc_time = document.getElementById("time");

const speech = new Speech.default();
// (async () => {
//   const voice = await speech.init();
//   console.log(voice);
//   speech.setLanguage("zh-TW");
//   speech.setVoice("Microsoft Yating - Chinese (Traditional, Taiwan)");
//   //   speech.setLanguage("ja-JP");
//   //   speech.setVoice("Microsoft Sayaka - Japanese (Japan)");
//   speech.setRate(1.5);

//   speech.speak({ text: "地震報告，下午2點44分左右，發生最大震度6強地震，震央位於台東縣池上鄉，深度8點0公里，地震規模7點8 " });
// })();