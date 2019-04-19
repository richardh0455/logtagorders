import React, { Component } from 'react';
import PropTypes from 'prop-types';

class AccordionSection extends Component {
  static propTypes = {
    children: PropTypes.instanceOf(Object).isRequired,
    isOpen: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    id: PropTypes.string,
    onClick: PropTypes.func.isRequired,
  };

  onClick = () => {
    if(this.props.id){
      this.props.onClick(this.props.id);
    }else {
      this.props.onClick(this.props.label);
    }
  };

  render() {
    const {
      onClick,
      props: { isOpen, label },
    } = this;

    return (
      <div
        style={{
          border: '1px solid',
          padding: '5px 10px',
        }}
      >
        <div onClick={onClick} style={{ cursor: 'pointer' }}>
          {label}
          <div style={{ float: 'right' }}>
            {!isOpen && <span>&#9650;</span>}
            {isOpen && <span>&#9660;</span>}
          </div>
        </div>
        {isOpen && (
          <div
            style={{
              border: '2px solid',
              marginTop: 10,
              padding: '10px 20px',
            }}
          >
            {this.props.children}
          </div>
        )}
      </div>
    );
  }
}

export default AccordionSection;
