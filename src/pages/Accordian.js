import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AccordianSection from './AccordianSection';

class Accordion extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Object).isRequired,
  };

  constructor(props) {
    super(props);
    const openSections = {};
    this.state = { openSections };
  }

  onClick = label => {
    const {
      state: { openSections },
    } = this;

    const isOpen = !!openSections[label];

    this.setState({
      openSections: {
        [label]: !isOpen
      }
    });
    if(this.props.onClick) {
      this.props.onClick(label);
    }

  };

  render() {
    const {
      onClick,
      props: { children },
      state: { openSections },
    } = this;

    return (
      <div style={{ border: '2px solid', 'margin-top':'40px' }}>
        {children.map(child => (
          <AccordianSection
            isOpen={!!openSections[child.props.id]}
            label={child.props.label}
            id={child.props.id}
            onClick={onClick}
          >
            {child.props.children}
          </AccordianSection>
        ))}
      </div>
    );
  }
}

export default Accordion;
