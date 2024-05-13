/* eslint-disable no-undef */
const file = new winston.transports.DailyRotateFile({
  filename      : path.join(app.getPath("logs"), "%DATE%.log"),
  datePattern   : "YYYY-MM-DD",
  zippedArchive : true,
  maxSize       : "20m",
  maxFiles      : "14d",
});

const logger = winston.createLogger({
  level  : "info",
  format : winston.format.printf(info => {
    const date = new Date();
    return `[${formatTwoDigits(date.getHours())}:${formatTwoDigits(date.getMinutes())}:${formatTwoDigits(date.getSeconds())}][${info.level.toUpperCase()}]: ${info.message}`;
  }),
  transports: [
    new winston.transports.Console(),
    file,
  ],
});