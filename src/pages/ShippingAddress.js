import React, { Component } from 'react';
import '../public/css/gridforms.css';



class ShippingAddress extends Component {
  constructor(props) {
    super(props);
  var shippingAddressLines = this.props.address.ShippingAddress.split(',');
	this.state = {
	  address1: shippingAddressLines[0],
    address2: shippingAddressLines[1],
    address3: shippingAddressLines[2],
    };
    this.handleAddress1Change = this.handleAddress1Change.bind(this);
    this.handleAddress2Change = this.handleAddress2Change.bind(this);
    this.handleAddress3Change = this.handleAddress3Change.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
  }
  handleAddress1Change(event) {
	this.setState({address1:event.target.value})
  this.props.update_address_handler(this.props.address.ID, this.buildShippingAddress())
  }
  handleAddress2Change(event) {
	this.setState({address2:event.target.value})
  this.props.update_address_handler(this.props.address.ID, this.buildShippingAddress())
  }
  handleAddress3Change(event) {
	this.setState({address3:event.target.value})
  this.props.update_address_handler(this.props.address.ID, this.buildShippingAddress())
  }

  buildShippingAddress(){
    return this.state.address1+', '+this.state.address2+', '+this.state.address3;

  }

  removeItem(event) {
	event.preventDefault();
	this.props.update_address_handler(this.props.address.ID, null)
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
			<div data-field-span="2">
				<label>Address Line 1</label>
				<input type="text" value={this.state.address} onChange={this.handleAddress1Change} />
			</div>
      <div data-field-span="2">
				<label>Address Line 2</label>
				<input type="text" value={this.state.address} onChange={this.handleAddress2Change} />
			</div>
      <div data-field-span="1">
				<label>City</label>
				<input type="text" value={this.state.address} onChange={this.handleAddress3Change} />
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
