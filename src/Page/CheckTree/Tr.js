import React, { Component } from 'react'
import Checkbox from 'antd/lib/checkbox'
import { DIRECTION, STATE } from './config'
import {
  isUndefined,
  checkArrayHasValue,
  generateArray,
} from './utils'

import './index.css'

function checkIsLastLeaf(currentLeaf, leafs) {
  return currentLeaf === leafs;
}
function checkIsNeedRowSpan(currentLeaf, leafs = 3) {
  return currentLeaf <= leafs - 2;
}

export default class CheckTree extends Component {
  constructor (props) {
    super(props);
    // 最大层级
    this.leafs = props.leafs;
    // 字段名定义
    this.fieldNames = {
      key: 'key',
      value: 'value',
      label: 'label',
      ...props.fieldNames
    };
    // 每次变动的节点
    this.changedKeys = [];
    // 表格数据
    this.tableList = [];
    // 字典
    this.dict = {};
    // 节点状态树
    this.nodeStates = {};
    // 生成表格数据的中间值
    this.records = [];
    // 树形数据格式化成表格数据
    this.convertData(props.data);
    // 将状态树写入state
    this.state = {
      nodeStates: this.nodeStates
    };
    // 释放无用值
    this.records = null;
  }
  
  getNodeKey = node => node[this.fieldNames.key];
  // 获取节点选中状态，惰性函数写法
  getNodeValue = (() => {
    const { checkedKeys } = this.props;
    if (checkedKeys) {
      return node => checkedKeys.includes(this.getNodeKey(node))
    }
    return node => !!node[this.fieldNames.value];
  })()
  // 格式化树，使其平展成表格所需数据，并进行字典的初始化
  convertData = (node, index = 0, parentKey = 0) => {
    let { children } = node;
    let key = this.getNodeKey(node);
    // 初始化字典
    this.initDict(node, index, parentKey);
    delete node.children;

    let currentLeaf = this.dict[key].leaf;
    !checkIsLastLeaf(currentLeaf, this.leafs) && this.changRecord(currentLeaf, node);
    if(!checkArrayHasValue(children)) {
      this.addData();
    }
    // 最后一级直接平铺数据
    else if(checkIsLastLeaf(currentLeaf + 1, this.leafs)) {
      this.records[currentLeaf] = children;
      children.forEach((v, i) => this.initDict(v, i, this.getNodeKey(this.records[currentLeaf - 1])));
      this.addData();
    } else {
      children.forEach((v, i) => this.convertData(v, i, key));
    }
  }
  // 字典初始化
  initDict = (node, index, parentKey) => {
    const key = this.getNodeKey(node);
    this.nodeStates[key] = Number(this.getNodeValue(node));
    this.dict[key] = this.dict[key] || {
      parentKey,
      rowSpan: 0,
      childKeys: [],
      checkedChildrenCount: 0,
      halfCheckedChildrenCount: 0,
      leaf: parentKey ? this.dict[parentKey].leaf + 1 : 1,
    };

    if(parentKey !== 0) {
      this.dict[parentKey].childKeys.push(key);
      if(this.getNodeValue(node)) {
        // 原始树中包含节点状态时，初始化checkedKeys
        const { initCheckedKeys, checkedKeys } = this.props;
        if(!checkedKeys && initCheckedKeys) {
          initCheckedKeys(key);
        }
        // 初始化字典中的checkedChildrenCount字段
        this.dict[parentKey].checkedChildrenCount += 1;
        // 如果状态和之前的兄弟节点状态不一致，判定为父级是半选，向上传递值
        if(
          this.dict[parentKey].checkedChildrenCount !== index + 1 &&
          this.nodeStates[parentKey] !== STATE.halfChecked
        ) {
          this.changeState(parentKey, STATE.halfChecked, DIRECTION.UPWARD_MODE);
        }
      }
    }
  }
  // 表格中需用到的每条数据添加进表格数据中
  addData = () => {
    const trData = {};
    const position = this.tableList.length;
    const balance = this.leafs - this.records.length;
    // 如果该分支上层级数不足最大层级，用undefined补齐
    if(balance > 0) {
      const fillers = generateArray(balance, () => undefined);
      this.records = [...this.records, ...fillers];
    }

    this.records.forEach((record, index) => {
      const currentLeaf = index + 1;
      trData[`leaf${currentLeaf}`] = record;
      if(record) {
        let key = this.getNodeKey(currentLeaf === this.leafs ? record[0] : record);
        if(isUndefined(this.dict[key].firstLocation)) {
          this.dict[key].firstLocation = position;
        }
        if(checkIsNeedRowSpan(currentLeaf, this.leafs)) {
          this.dict[key].rowSpan += 1;
        };
      }
    });
    this.tableList.push(trData);
  }
  
  // 单条数据构建
  changRecord = (currentLeaf, newValue) => {
    this.records.length = currentLeaf - 1;
    this.records.push(newValue);
  }
  // 选中某项的回调
  handleChange = (e, key) => {
    const { onChange } = this.props;
    let state = Number(e.target.checked);

    this.changedKeys = [];
    this.changeState(key, state);
    if(onChange) {
      onChange(this.changedKeys, state);
    }
    this.setState({
      nodeStates: this.nodeStates
    });
  }
  // 保存单次点击新增（删减）的key
  addKeyToChangedKeys = key => {
    this.changedKeys.push(key);
  }

  // 选中后改变值
  changeState = (key, state, direction) => {
    const { parentKey, childKeys } = this.dict[key];
    let hasParent = parentKey !== 0;
    let currentState = this.nodeStates[key];
    if(state === STATE.checked) {
      if(currentState === STATE.unchecked) {
        hasParent && (this.dict[parentKey].checkedChildrenCount += 1);
        this.addKeyToChangedKeys(key);
      } 
      else {
        hasParent && (this.dict[parentKey].halfCheckedChildrenCount -= 1);
      }
    } 
    else if(state === STATE.unchecked) {
      hasParent && (this.dict[parentKey].checkedChildrenCount -= 1);
      this.addKeyToChangedKeys(key);
      if(hasParent && currentState === STATE.halfChecked) {
        this.dict[parentKey].halfCheckedChildrenCount -= 1;
      }
    } 
    else {
      hasParent && (this.dict[parentKey].halfCheckedChildrenCount += 1);
      if(currentState === STATE.unchecked) {
        hasParent && (this.dict[parentKey].checkedChildrenCount += 1);
        this.addKeyToChangedKeys(key);
      }
    }
    
    this.nodeStates[key] = state;

    // 若是勾选触发，则该节点上下节点都要传递一遍
    // 若是传递过程中的传递，则只需要方向（direction）指向上下其中一个就行了
    let isUpwardMode = !direction || direction === DIRECTION.UPWARD_MODE;
    let isDownwardMode = !direction || direction === DIRECTION.DOWNWARD_MODE;
    if(isUpwardMode && parentKey) {
      this.handlePreChange(parentKey, state);
    }
    if(isDownwardMode && childKeys.length) {
      this.handleNextChange(childKeys, state);
    }
  }
  // 向上传递勾选状态（选中、半选、取消选中）
  handlePreChange = (key, childState) => {
    const { 
      checkedChildrenCount, 
      halfCheckedChildrenCount, 
      childKeys 
    } = this.dict[key];
    let currentState = this.nodeStates[key];
    if(childState === STATE.halfChecked && currentState !== STATE.halfChecked) {
      this.changeState(key, STATE.halfChecked, DIRECTION.UPWARD_MODE);
      return;
    }
    if(!checkedChildrenCount) {
      this.changeState(key, STATE.unchecked, DIRECTION.UPWARD_MODE);
    } 
    else if(checkedChildrenCount === childKeys.length && !halfCheckedChildrenCount){
      this.changeState(key, STATE.checked, DIRECTION.UPWARD_MODE);
    } 
    else if(currentState !== STATE.halfChecked){
      this.changeState(key, STATE.halfChecked, DIRECTION.UPWARD_MODE);
    }
  }
  // 向下传递勾选状态（选中、取消选中）
  handleNextChange = (childKeys, parentState) => {
    childKeys.forEach(childKey => {
      if(this.nodeStates[childKey] !== parentState) {
        this.changeState(childKey, parentState, DIRECTION.DOWNWARD_MODE)
      }
    })
  }
  
  render () {
    const { nodeStates } = this.state;
    return (
      !!this.tableList.length && this.tableList.map((item, index) => (
        <tr key={`tree_tr_${index}`}>
          {
            Object.values(item).map((currentLeafItem, i) => {
              const currentLeaf = i + 1;
              const isLastLeaf = currentLeaf === this.leafs;

              if(isUndefined(currentLeafItem)) {
                return <td key={`null_td_${i}`}></td>;
              }
              let key = isLastLeaf ? '' : this.getNodeKey(currentLeafItem);
              const isNeedRowSpan = (
                checkIsNeedRowSpan(currentLeaf, this.leafs) && 
                !!(this.dict[key].rowSpan - 1)
              );
              
              if(
                (isNeedRowSpan && this.dict[key].firstLocation !== index) ||
                (isLastLeaf && !checkArrayHasValue(currentLeafItem))
              ) {
                return null;
              }
              const rowSpanConfig = isNeedRowSpan ? { 
                rowSpan: this.dict[key].rowSpan 
              } : {};
              return (
                <td 
                  key={`LEAF_${i}`}
                  className={isLastLeaf ? 'lastLeaf' : ''}
                  {...rowSpanConfig}
                >
                  {
                    isLastLeaf ? currentLeafItem.map(node => {
                      let nodeKey = this.getNodeKey(node);
                      return (
                        <Checkbox
                          key={nodeKey}
                          checked={nodeStates[nodeKey]}
                          onChange={e=>this.handleChange(e,nodeKey)}
                          indeterminate={nodeStates[nodeKey] === STATE.halfChecked}
                        >
                          { node[this.fieldNames.label] }
                        </Checkbox>
                      )
                    })
                    : (
                      <Checkbox
                        checked={nodeStates[key]}
                        onChange={e=>this.handleChange(e,key)}
                        indeterminate={nodeStates[key] === STATE.halfChecked}
                      >
                        { currentLeafItem[this.fieldNames.label] }
                      </Checkbox>
                    )
                  }
                </td>
              )
            })
          }
        </tr>
      ))
    )
  }
}