const isNuldefined = (entity) => {
  if (entity instanceof String) entity = entity.trim();
  return (
    entity === "" ||
    entity === undefined ||
    entity === null ||
    getObjLen(entity) === 0
  );
};

const getObjLen = (obj) => {
  let length = 0;
  try {
    for (let _ in obj) length++;
  } catch {}
  return length;
};

const checks = {
  isNuldefined,
};

export default checks;
