import React from 'react';
import ReactDOM from 'react-dom';
import Page from './Page';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
