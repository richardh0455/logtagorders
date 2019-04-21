import React from 'react';
import ReactDOM from 'react-dom';
import { shallow } from 'enzyme';
import CreateVariant from '../pages/CreateVariant';


describe('First React component test with Enzyme', () => {
   it('renders without crashing', () => {
      shallow(<CreateVariant />);
    });
});
