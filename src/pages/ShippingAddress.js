import React, { Component } from 'react';
import '../public/css/gridforms.css';



class ShippingAddress extends Component {
  constructor(props) {
    super(props);
  //var shippingAddressLines = this.props.address.split(',').map(address => address.trim())

  }


  handleAddress1Change = (event) => {
	   //this.props.address1 = event.target.value
     this.props.update_address_handler(this.props.id, 'address1',event.target.value)
  }
  handleAddress2Change = (event) => {
	   //this.props.address2 = event.target.value
     this.props.update_address_handler(this.props.id, 'address2',event.target.value)
  }
  handleAddress3Change = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'address3',event.target.value)
  }
  handleAddress4Change = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'address4',event.target.value)
  }
  handleStateChange = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'state',event.target.value)
  }
  handleCountryChange = (event) => {
    //this.props.address3 = event.target.value
    this.props.update_address_handler(this.props.id, 'country',event.target.value)
  }



  //}

  removeItem = (event) => {
	event.preventDefault();
	this.props.update_address_handler(this.props.id, null)
  }

  onKeyPress = (event) => {
    if (event.which === 13 /* Enter */) {
	  event.preventDefault()
    }
  }


  render() {
    return (
      <div className onKeyPress={this.onKeyPress}>
      <div data-row-span="9">
			<div data-field-span="2">
				<label>Address Line 1</label>
				<input type="text" value={this.props.address1} onChange={this.handleAddress1Change} />
			</div>
      <div data-field-span="2">
				<label>Address Line 2</label>
				<input type="text" value={this.props.address2}  onChange={this.handleAddress2Change}/>
			</div>
      <div data-field-span="1">
				<label>City</label>
				<input type="text" value={this.props.address3}  onChange={this.handleAddress3Change}/>
			</div>
      <div data-field-span="1">
				<label>State</label>
				<input type="text" value={this.props.state}  onChange={this.handleStateChange}/>
			</div>
      <div data-field-span="1">
				<label>Country</label>
				<input type="text" value={this.props.country}  onChange={this.handleCountryChange}/>
			</div>
      <div data-field-span="1">
				<label>Postal Code</label>
				<input type="text" value={this.props.address4} onChange={this.handleAddress4Change} />
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
