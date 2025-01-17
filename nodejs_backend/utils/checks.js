const isNuldefined = (entity) => {
  if (Number.isInteger(entity)) return entity === 0;
  if (entity instanceof String) return entity.trim().length === 0;
  if (Array.isArray(entity)) return entity.length === 0;
  if (isObject(entity)) return getObjLen(entity) === 0;
  return entity === undefined || entity === null || entity === NaN;
};

const areValuesNull = (values = []) => {
  for (const val of values) {
    if (isNuldefined(val)) return true;
  }
  return false;
};

const isTrue = (entity, _true = "true") => {
  return String(entity).trim() === _true;
};

const isObject = (ent) => {
  return (
    ent != undefined &&
    ent != null &&
    ent.constructor === Object &&
    ent instanceof Object
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
  isTrue,
  isAnyValueNull: areValuesNull,
};

export default checks;
