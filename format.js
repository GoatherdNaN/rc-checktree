const fs = require('fs');

let leafs = +process.env.LEAFS;
leafs = /^[1-9]\d*$/.test(leafs) && leafs > 1  ? leafs : 2;

function newRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateArray(len, mapBack) {
  return Array.from(new Array(len)).map(mapBack);
}

function newItem(len, pid) {
  return len ? generateArray(len, (_, i) => {
    let id = `${pid}${i + 1}`;
    return {
      id: +id,
      name: `节点${id.length}_${id}`,
    }
  }) : 0;
}

function formatData(arr, leaf, state) {
  return arr.map((v, i) => {
    let value = state || (arr.length === 1 ? true : (i === 0 ? true : !!newRandom(0,1)));
    v.children = leaf !== leafs ? newItem(newRandom(0, 3), v.id) : 0;
    if(v.children) {
      v.children = formatData(v.children, leaf + 1, value);
      return {
        key: v.id,
        label: v.name,
        value,
        children: v.children,
      }
    }
    return {
        key: v.id,
        label: v.name,
        value
      }
  })
}
const data = newItem(1||newRandom(2,3), '');
const treeData = formatData(data, 1, false);

fs.writeFile(
  './src/Page/data.json',
  JSON.stringify({
    leafs,
    treeData
  }),
  function(e) {
    if(e) {
      console.log(e);
    }
  }
);