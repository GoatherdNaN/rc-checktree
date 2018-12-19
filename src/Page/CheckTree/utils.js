const chnNumChar = ["零","一","二","三","四","五","六","七","八","九"];
const chnUnitChar = ["","十","百","千"];

export const isArray = Array.isArray;

export function isUndefined(value) {
  return typeof value === 'undefined'
}
export function checkArrayHasValue(children) {
  return isArray(children) && !!children.length
}
export function checkAllItemIsString(arr) {
  return checkArrayHasValue(arr) && arr.some(v => typeof(v) == 'string')
}

export function sectionToChinese(section){
  let strIns = '', chnStr = '';
  let unitPos = 0;
  let zero = true;
  while(section > 0){
    let v = section % 10;
    if(v === 0){
      if(!zero){
        zero = true;
        chnStr = chnNumChar[v] + chnStr;
      }
    }else{
      zero = false;
      strIns = chnNumChar[v];
      strIns += chnUnitChar[unitPos];
      chnStr = strIns + chnStr;
    }
    unitPos++;
    section = Math.floor(section / 10);
  }
  return chnStr;
}
export function numToChn(num) {
  return `${sectionToChinese(num + 1)}级节点`;
}
export function generateArray(len, mapBack) {
  return Array.from(new Array(len)).map(mapBack);
}

export function warning(message) {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message)
  }
  /* eslint-enable no-console */
  try {
    throw new Error(message)
  } catch (e) {} // eslint-disable-line no-empty
}