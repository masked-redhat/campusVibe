const waitPeriod = 2000; // 4 secs

const restart = (fn) => {
  console.log("Trying again after ...");

  setTimeout(async () => {
    await fn();
  }, waitPeriod);
};

export default restart;
