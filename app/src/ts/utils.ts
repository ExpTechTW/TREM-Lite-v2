const intensity_list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];

const utils = {
  url: (t: string) => {
    return `https://${t}-${Math.ceil(Math.random() * 2)}.exptech.dev/api/`;
  },
  int_to_intensity: (int: string | number) => {
    return typeof int === "number" ? intensity_list[int] : "0";
  },
  parseJSON: (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      return null;
    }
  },
  now: () => Date.now() + 0,
  formatTwoDigits: (n: number) => (n < 10 ? "0" + n : n),
  formatTime: (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },
};

export default utils;
