import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import CreateOrder from '../pages/CreateOrder';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<CreateOrder />);
    });
});
