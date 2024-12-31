const waitPeriod = 4000; // 4 secs

const restart = (fn) => {
  console.log(`Trying again after ${waitPeriod / 1000} secs ...`);

  setTimeout(async () => {
    await fn();
  }, waitPeriod);
};

export default restart;
