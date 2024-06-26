import utils from "../ts/utils";

const MAX_RETRY_ATTEMPTS = 3;

export async function getStationInfo(): Promise<unknown> {
  console.log("[Fetch] Fetching station data...");
  let retryCount = 0;

  return new Promise((resolve, reject) => {
    const retryClock = setInterval(async () => {
      retryCount++;

      try {
        const res = await fetch(`${utils.url("api")}v1/trem/station`);
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const data = await res.json();

        if (data) {
          console.log("[Fetch] Got station data");
          clearInterval(retryClock);
          resolve(data);
        }
      } catch (err) {
        console.log(`[Fetch] ${err} (Try #${retryCount})`);
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          clearInterval(retryClock);
          reject(err);
        }
      }
    }, 5_000);
  });
}
