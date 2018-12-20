# rc-checktree

## 前言
之前项目中，需要为用户做授权操作时，由于产品设计的原因，需要把权限树设计成表格的形式，但权限树的多级联动，加上需要加上半选状态，会产生很多遍历，当层级少的时候还好，层级多起来就容易出现性能问题。权限树层级由于业务上考虑，不排除增加层级的可能。所以决定动手封装个不限层级的选择树组件。

## 实现效果
![image](https://github.com/GoatherdNaN/rc-checktree/blob/master/screenshots/GUI.gif?raw=true)


## 整体思路和方案设计([实现代码](https://github.com/GoatherdNaN/rc-checktree/blob/master/src/Page/CheckTree/Tr.js))
#### 整体思路
1. 通过初始化时构建字典，尽可能的减少遍历操作

```
<!--单个节点的字典-->
{
    leaf, <!--节点所在层级-->
    rowSpan, <!--需要合并的行数-->
    childKeys, <!--子key-->
    parentKey, <!--父key-->
    firstLocation, <!--首次出现在表格数据的位置-->
    checkedChildrenCount, <!--选中的子数量-->
    halfCheckedChildrenCount, <!--半选的子数量-->
}
```
2. 分化每个源节点（没有父级的节点），当其下面子节点状态变更时，只对该分支（每个源节点对应一个分支）数据进行更改，避免重新渲染整棵节点树
3. 优化算法，单个节点状态变更时，依赖字典，状态对上下两个方向进行传递，从而实现联动

```
// 每个节点共有以下三种状态，半选的checked值也为true
{
  unchecked: 0, // 取消选中
  checked: 1, // 选中
  halfChecked: 2, // 半选
}
```

#### 方案设计
1. 将传入的树型数据转化成表格数据，并完成字典数据，及状态树的初始化

```
convertData(); // 递归，最后一级平铺数据
initDict(); // 初始化字典及状态树，但判断到出现半选并且父级不是半选时，向上传递
// 用状态树来控制ui上的更改
this.state = {
  nodeStates: this.nodeStates
};
```
2. 单个节点变更时

```
// fun: changState()
const { parentKey, childKeys } = this.dict[key];
let hasParent = parentKey !== INIT_PARENT_KEY;
let currentState = this.nodeStates[key];
// 更新字典树的checkedChildrenCount和halfCheckedChildrenCount字段
if(state === STATE.checked) {
    // 没选中变成选中
    if(currentState === STATE.unchecked) {
        hasParent && (this.dict[parentKey].checkedChildrenCount += 1);
    }
    // 半选变成选中
    else {
        hasParent && (this.dict[parentKey].halfCheckedChildrenCount -= 1);
    }
}
// 取消选中
else if(state === STATE.unchecked) {
      hasParent && (this.dict[parentKey].checkedChildrenCount -= 1);
      // 半选变成取消选中
      if(hasParent && currentState === STATE.halfChecked) {
        this.dict[parentKey].halfCheckedChildrenCount -= 1;
      }
}
// 半选
else {
    hasParent && (this.dict[parentKey].halfCheckedChildrenCount += 1);
    // 取消选中变成半选
    if(currentState === STATE.unchecked) {
        hasParent && (this.dict[parentKey].checkedChildrenCount += 1);
    }
}
// 改变当前节点的值
this.nodeStates[key] = state;

// 若是勾选触发，则该节点上下节点都要传递一遍
// 若是传递过程中的传递，则只需要方向（direction）指向上下其中一个就行了
let isUpwardMode = !direction || direction === DIRECTION.UPWARD_MODE;
let isDownwardMode = !direction || direction === DIRECTION.DOWNWARD_MODE;
if(isUpwardMode && parentKey !== INIT_PARENT_KEY) {
    this.handlePreChange(parentKey, state);
}
if(isDownwardMode && childKeys.length) {
    this.handleNextChange(childKeys, state);
}
```
3. 向上传递

```
// fun: handlePreChange()
const { 
    checkedChildrenCount, 
    halfCheckedChildrenCount, 
    childKeys 
} = this.dict[key];
let currentState = this.nodeStates[key];
// 初始化时的处理
if(childState === STATE.halfChecked && currentState !== STATE.halfChecked) {
    this.changeState(key, STATE.halfChecked, DIRECTION.UPWARD_MODE);
    return;
}
// 根据字典树，得到父节点的值
// 子节点没有选中的，此时父节点取消选中
if(!checkedChildrenCount) {
    this.changeState(key, STATE.unchecked, DIRECTION.UPWARD_MODE);
} 
// 子节点全选中，但没有半选状态的子节点，此时父节点变为选中
else if(checkedChildrenCount === childKeys.length && !halfCheckedChildrenCount){
    this.changeState(key, STATE.checked, DIRECTION.UPWARD_MODE);
}
// 当父节点变更前的状态不为半选时，改变父节点状态为半选，并传递
else if(currentState !== STATE.halfChecked){
    this.changeState(key, STATE.halfChecked, DIRECTION.UPWARD_MODE);
}
```
4. 向下传递

```
// fun: handleNextChange(),向下传递时，只要把所有后代节点状态变成当前节点状态即可
childKeys.forEach(childKey => {
    // 子节点状态与父节点不同时，才向下传递
    if(this.nodeStates[childKey] !== parentState) {
        this.changeState(childKey, parentState, DIRECTION.DOWNWARD_MODE)
    }
})

```
## API

参数 | 说明 | 类型
---|---|---
treeData | 节点树(必填) | Array
checkedKeys | 选中复选框的树节点(如果treeData中不含state时，用此数据初始化选中) | Array
theads | 表头(注意表头数组长度和最大层级要对应) | Array
leafs | 最大层级(与theads至少要传入一个，以确定最大层级) | Number
loading | 数据加载状态 | Boolean
fieldNames | treeData中的字段值 | Object
onChange | 树节点状态变化时触发 | Function

#### 说明
1. treeData中，每个节点数据结构如下

```
{
    key, // 主键
    label, // 节点名
    value, // 非必有字段，可由传入checkedKeys控制
    children // 有子节点时存在，无子节点时只要不是有值数组即可
}
```

2. 最大层级通过theads数组长度或leafs，theads数组长度优先级高于leafs，之所以要确定最大长度，是为了渲染表格数据方便
3. fieldNames三个字段自由配置
4. onChange内可接受checkKeys

```
{
    key, // 节点的主键
    label, // 节点名
    value, // 默认是根据这个值来确定节点的状态，如果传入checkedKeys，则这个值无效
}
```
## 查看效果

```
git clone https://github.com/GoatherdNaN/rc-checktree.git
cd rc-checktree
npm i
npm start
```
#### 提示：

```
<!--LEAFS可更改，来生成自定义层级的模拟数据，默认为5层，最小为2，最大看个人电脑性能-->
"start": "cross-env LEAFS=7 node ./format.js && react-scripts start",
```
