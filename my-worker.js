let fileContent = "";
onmessage = function (e) {
  const { type, data } = e.data;

  if (type === "chunk") {
    fileContent += data;
  }

  if (type === "eof") {
    console.time("parse");
    const parsed = JSON.parse(fileContent);
    console.timeEnd("parse");

    console.time("flattener");
    const flattened = flattenJSONObj(parsed);
    console.timeEnd("flattener");

    const chunkSize = 20_000;
    for (let index = 0; index < flattened.length; index += chunkSize) {
      this.postMessage({
        type: "chunk",
        data: flattened.slice(index, index + chunkSize),
      });
    }

    this.postMessage({ type: "eof" });
  }
};

function flattenJSONObj(obj, prevNormalized = [], level = 0) {
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      prevNormalized.push({ type: "PRIMTIVE", key, value: obj[key], level });
    } else {
      if (obj[key] == null) {
        prevNormalized.push({ type: "PRIMTIVE", key, value: "null", level });
      } else {
        if (Array.isArray(obj[key])) {
          prevNormalized.push({ type: "ARRAY_START", key, value: "[", level });
        } else {
          prevNormalized.push({ type: "OBJECT_START", key, value: "{", level });
        }

        flattenJSONObj(obj[key], prevNormalized, level + 1);

        if (Array.isArray(obj[key])) {
          prevNormalized.push({ type: "OBJECT_START", value: "]", level });
        } else {
          prevNormalized.push({ type: "OBJECT_END", value: "}", level });
        }
      }
    }
  }

  return prevNormalized;
}
