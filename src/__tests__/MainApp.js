import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import MainApp from '../pages/MainApp';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<MainApp />);
    });
});
