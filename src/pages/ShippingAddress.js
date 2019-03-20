import React, { Component } from 'react';
import '../public/css/gridforms.css';



class ShippingAddress extends Component {
  constructor(props) {
    super(props);
	this.state = {
      key: this.props.address.key,
	  address: this.props.address.value,
    };
	
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
  }	
  handleAddressChange(event) {
	this.props.update_address_handler(this.state.key, event.target.value)
	this.setState({address:event.target.value})
  }

  
  removeItem(event) {
	event.preventDefault();
	this.props.update_address_handler(this.state.key, null)
  }
  
  onKeyPress(event) {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }
  
	
  render() { 
    return (
      <div className onKeyPress={this.onKeyPress}>
        <div data-row-span="6">
			<div data-field-span="5">
				<label>Shipping Address</label>
				<input type="text" value={this.state.address} onChange={this.handleAddressChange} />
			</div>
			<div data-field-span="1">
				<button onClick={this.removeItem}  >Remove Item</button>
			</div>			
		</div>
	  </div>
    );
  }
}

export default ShippingAddress;