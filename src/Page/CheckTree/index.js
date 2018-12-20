import React from 'react'
import PropTypes from 'prop-types'
import Tr from './Tr'
import Spin from 'antd/lib/spin'
import { STATE } from './config'
import {
  numToChn,
  checkArrayHasValue,
  checkAllItemIsString,
  generateArray,
  warning,
} from './utils'

import './index.css'

export default class CheckTree extends React.Component {
  constructor (props) {
    super(props);
    this.checkedKeys = props.checkedKeys || [];
  }

  static propTypes = {
    onChange: PropTypes.func,
    fieldNames: PropTypes.object,
    treeData: PropTypes.array.isRequired,
    checkedKeys: PropTypes.array,
    theads: PropTypes.array,
    leafs: PropTypes.number,
    loading: PropTypes.bool,
  }

  initCheckedKeys = checkedKey => this.checkedKeys.push(checkedKey);

  handleChange = (changedKeys, state) => {
    const { onChange } = this.props;
    if(!onChange) return;
    if(state === STATE.checked) {
      this.checkedKeys = [...this.checkedKeys, ...changedKeys];
    } else if(state === STATE.unchecked) {
      changedKeys.forEach(key => {
        let index = this.checkedKeys.findIndex(v => v === key);
        this.checkedKeys.splice(index, 1);
      })
    }
    onChange(this.checkedKeys);
  }
  render() {
    const {
      theads,
      leafs,
      treeData = [],
      loading = false,
      ...otherProps
    } = this.props;
    const isLegalTheads = checkArrayHasValue(theads);
    const $leafs = isLegalTheads ? theads.length : leafs;

    // 校验总层级是否为正整数
    if(!(/^[1-9]\d*$/.test($leafs))) {
      throw new Error('Expected the theads to be a array or the leafs to be a positive integer.')
    }

    if($leafs > 10) {
      warning('It\'s better not to exceed 10 columns in this table.')
    }

    let theadInfo = generateArray($leafs, (_, i) => numToChn(i));

    if(isLegalTheads) {
      if(checkAllItemIsString(theads)) {
        theadInfo = theads;
      } else {
        warning('Expected each item of the theads to be a string.');
      }
    }

    return (
      <table className='merge-table'>
        <thead>
          <tr>
            {theadInfo.map((title, i) => (
              <th key={`THEAD_${i}`}>
                { title }
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {
            checkArrayHasValue(treeData) ? treeData.map((item, index) => (
              <Tr 
                {...otherProps}
                key={`TREE_KEY_${index}`} 
                leafs={$leafs} 
                data={item}
                initCheckedKeys={this.initCheckedKeys}
                onChange={this.handleChange} />
            )) : (
              <tr>
                <td className='noData' colSpan={$leafs}>
                  { loading ?  <Spin /> : '没有数据' }
                </td>
              </tr>
            )
          }
        </tbody>
      </table>
    )
  }
  
}