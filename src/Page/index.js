import React, { Component } from 'react';
import CheckTree from './CheckTree'
import data from './data.json'

export default class Rowspan extends Component {
  state = {
    treeData: [],
    loading: false,
  }

  componentDidMount() {
    const that = this;
    this.setState({
      loading: true,
    });
    const timer = setTimeout(function() {
      that.setState({
        treeData: data.treeData,
        loading: false,
      },() => {
        clearTimeout(timer);
      });
    })
  }

  changeTree = checkedKeys => {
    console.log('checkedKeysLen',checkedKeys.length);
  }

  render() {
    const { treeData, loading } = this.state;

    const leafs = data.leafs;
    const props = {
      treeData,
      loading,
      leafs,
      // checkedKeys: [1,12,3]
    }
    return <CheckTree onChange={this.changeTree} {...props} />
  }
}